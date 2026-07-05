// Resuelve huecos de eliminatoria cuyo equipo todavía no se conoce.
//
// Un partido de eliminatoria nace como placeholder: homeCode/awayCode null,
// homeTeam/awayTeam con texto descriptivo ("2º Grupo A", "Ganador Partido 73")
// y homeFrom/awayFrom con la regla machine-readable que dice de dónde sale
// ese equipo. Dos formas de regla soportadas:
//   "group:<LETRA>:<1|2>" → 1º o 2º clasificado de ese grupo.
//   "match:<numero>:<W|L>" → ganador o perdedor de ese partido.
// Cualquier otra cosa (p.ej. "thirds:A,B,C,D,F", mejor 3º entre esos grupos)
// no se resuelve aquí — depende de la tabla oficial de la FIFA y se añade a
// mano cuando se conoce el cruce real, igual que la Final de Champions.
//
// Sólo resolvemos cuando no hay ambigüedad: si la fase de grupos no ha
// terminado, o el resultado de un partido de eliminatoria empató a falta de
// definir quién pasó (prórroga/penaltis, que no registramos), dejamos el
// hueco para que un admin lo rellene a mano.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import type { Match } from "@/lib/db/schema";

type GroupRow = {
  code: string;
  name: string;
  flag: string | null;
  pts: number;
  gf: number;
  ga: number;
};

type SourceRule =
  | { kind: "group"; letter: string; position: 1 | 2 }
  | { kind: "match"; matchNumber: number; outcome: "W" | "L" };

function parseSourceRule(rule: string | null): SourceRule | null {
  if (!rule) return null;
  const group = /^group:([A-Z]):([12])$/.exec(rule);
  if (group) {
    return { kind: "group", letter: group[1], position: Number(group[2]) as 1 | 2 };
  }
  const match = /^match:(\d+):([WL])$/.exec(rule);
  if (match) {
    return {
      kind: "match",
      matchNumber: Number(match[1]),
      outcome: match[2] as "W" | "L",
    };
  }
  return null;
}

// null si el grupo no ha terminado, le falta algún código de equipo, o el
// 1º/2º quedan empatados de forma ambigua (no implementamos el desempate
// completo de la FIFA — preferimos no resolver a resolver mal).
function computeGroupStandings(groupMatches: Match[]): GroupRow[] | null {
  if (groupMatches.length === 0) return null;
  if (groupMatches.some((m) => m.homeScore == null || m.awayScore == null)) {
    return null;
  }

  const table = new Map<string, GroupRow>();
  const ensure = (code: string | null, name: string, flag: string | null) => {
    if (!code) return null;
    let row = table.get(code);
    if (!row) {
      row = { code, name, flag, pts: 0, gf: 0, ga: 0 };
      table.set(code, row);
    }
    return row;
  };

  for (const m of groupMatches) {
    const home = ensure(m.homeCode, m.homeTeam, m.homeFlag);
    const away = ensure(m.awayCode, m.awayTeam, m.awayFlag);
    if (!home || !away) return null;
    home.gf += m.homeScore!;
    home.ga += m.awayScore!;
    away.gf += m.awayScore!;
    away.ga += m.homeScore!;
    if (m.homeScore! > m.awayScore!) home.pts += 3;
    else if (m.homeScore! < m.awayScore!) away.pts += 3;
    else {
      home.pts += 1;
      away.pts += 1;
    }
  }

  const rows = [...table.values()].sort(
    (a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf
  );
  if (rows.length < 2) return null;
  const [first, second] = rows;
  const tied =
    first.pts === second.pts &&
    first.gf - first.ga === second.gf - second.ga &&
    first.gf === second.gf;
  if (tied) return null;

  return rows;
}

type ResolvedTeam = { code: string; name: string; flag: string | null };

// Devuelve los matchNumber resueltos en esta pasada (para logging del cron).
export async function resolveKnockoutPlaceholders(
  tournamentId: number
): Promise<number[]> {
  const all = await db
    .select()
    .from(matches)
    .where(eq(matches.tournamentId, tournamentId));

  // Re-evalúa todos los partidos con regla machine-readable (match:/group:).
  // Los "thirds:*" los completa un admin a mano — parseSourceRule los ignora.
  // Re-evaluar siempre garantiza que si un resultado fuente cambia (corrección
  // de marcador), el equipo en el cruce downstream también se actualiza.
  const pending = all.filter(
    (m) =>
      (m.homeFrom && !m.homeFrom.startsWith("thirds:")) ||
      (m.awayFrom && !m.awayFrom.startsWith("thirds:"))
  );
  if (pending.length === 0) return [];

  const byNumber = new Map(all.map((m) => [m.matchNumber, m]));
  const byGroup = new Map<string, Match[]>();
  for (const m of all) {
    if (!m.groupName || m.groupName.length !== 1) continue;
    let bucket = byGroup.get(m.groupName);
    if (!bucket) {
      bucket = [];
      byGroup.set(m.groupName, bucket);
    }
    bucket.push(m);
  }

  const standingsCache = new Map<string, GroupRow[] | null>();
  const standingsFor = (letter: string) => {
    if (!standingsCache.has(letter)) {
      standingsCache.set(letter, computeGroupStandings(byGroup.get(letter) ?? []));
    }
    return standingsCache.get(letter)!;
  };

  const resolveTeam = (rule: string | null): ResolvedTeam | null => {
    const parsed = parseSourceRule(rule);
    if (!parsed) return null;

    if (parsed.kind === "group") {
      const standings = standingsFor(parsed.letter);
      const row = standings?.[parsed.position - 1];
      return row ? { code: row.code, name: row.name, flag: row.flag } : null;
    }

    const source = byNumber.get(parsed.matchNumber);
    if (!source || source.homeScore == null || source.awayScore == null) {
      return null;
    }
    if (!source.homeCode || !source.awayCode) return null;

    let homeWon: boolean;
    if (source.homeScore !== source.awayScore) {
      homeWon = source.homeScore > source.awayScore;
    } else if (
      source.homeScoreAet != null &&
      source.awayScoreAet != null &&
      source.homeScoreAet !== source.awayScoreAet
    ) {
      // Decidido en prórroga
      homeWon = source.homeScoreAet > source.awayScoreAet;
    } else if (source.penaltyHome != null && source.penaltyAway != null) {
      // Decidido en penaltis
      homeWon = source.penaltyHome > source.penaltyAway;
    } else {
      // Empate sin datos de prórroga/penaltis aún → no resolver todavía
      return null;
    }

    const wantHome = parsed.outcome === "W" ? homeWon : !homeWon;
    return wantHome
      ? { code: source.homeCode, name: source.homeTeam, flag: source.homeFlag }
      : { code: source.awayCode, name: source.awayTeam, flag: source.awayFlag };
  };

  const resolvedNumbers: number[] = [];
  for (const m of pending) {
    const update: Partial<typeof matches.$inferInsert> = {};
    let teamChanged = false;

    if (m.homeFrom && !m.homeFrom.startsWith("thirds:")) {
      const team = resolveTeam(m.homeFrom);
      // Solo escribe si resolvimos Y el código cambió (evita writes innecesarios)
      if (team && team.code !== m.homeCode) {
        update.homeCode = team.code;
        update.homeTeam = team.name;
        update.homeFlag = team.flag;
        teamChanged = true;
      }
    }
    if (m.awayFrom && !m.awayFrom.startsWith("thirds:")) {
      const team = resolveTeam(m.awayFrom);
      if (team && team.code !== m.awayCode) {
        update.awayCode = team.code;
        update.awayTeam = team.name;
        update.awayFlag = team.flag;
        teamChanged = true;
      }
    }

    // Si el equipo de un lado cambia (p.ej. se corrige a mano un cruce mal
    // resuelto por un bug previo), cualquier apiFixtureId/score que colgara
    // de esta fila pertenecía al emparejamiento ANTERIOR y queda inválido:
    // el cron lo re-descubrirá solo en su siguiente pasada. Sin este reset,
    // un fixture/resultado mal enganchado sobrevive silenciosamente al cambio
    // de equipo (así se coló el bug de M90/M91 con Paraguay-Francia).
    if (
      teamChanged &&
      (m.apiFixtureId != null ||
        m.homeScore != null ||
        m.awayScore != null ||
        m.resultSource != null)
    ) {
      update.apiFixtureId = null;
      update.homeScore = null;
      update.awayScore = null;
      update.homeScoreAet = null;
      update.awayScoreAet = null;
      update.penaltyHome = null;
      update.penaltyAway = null;
      update.resultSource = null;
    }

    if (Object.keys(update).length > 0) {
      await db.update(matches).set(update).where(eq(matches.id, m.id));
      resolvedNumbers.push(m.matchNumber);
    }
  }

  return resolvedNumbers;
}
