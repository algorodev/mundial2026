// Cron de auto-resultados + notificaciones push.
//
// Para cada torneo con apiLeagueId/apiSeason y status 'live' o 'upcoming':
//   1. Pide fixtures de la ventana [ayer-UTC, hoy-UTC] a API-Football.
//   2. Por cada fixture FT/AET/PEN cuyo apiFixtureId coincida con uno nuestro:
//      - Escribe homeScore/awayScore (si != admin) y marca resultSource='api'.
//      - Si es la primera vez que vemos el FT (markEventOnce('ft')),
//        envía push "Final" a los miembros de grupos del torneo suscritos.
//   3. NUNCA pisa rows con resultSource='admin' (override manual gana siempre).
//   4. Solo escribe resultados FINALES — los parciales se notifican como
//      eventos de gol/roja/penalti fallado (paso 5) pero no tocan la DB.
//   5. Para cada fixture en juego (1H/HT/2H/ET/P): pide /fixtures/events y
//      dispara push por cada evento relevante (gol, roja, penalti fallado)
//      que no se haya notificado antes.
//   6. Recordatorio kickoff: para matches cuyo kickoffAt está entre +5 y
//      +20 min, envía un push "Empieza en 15 min" una sola vez.
//
// Auth: header `Authorization: Bearer ${CRON_SECRET}`. Sin secret, 401.
// Schedule: GitHub Actions cada 10 min (.github/workflows/cron-results.yml).

import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments, teams } from "@/lib/db/schema";
import type { Match } from "@/lib/db/schema";
import {
  getFixtureEvents,
  getFixturesByDateRange,
  isFinalScore,
  isLive,
  type ApiFixture,
} from "@/lib/api-football";
import {
  notifyFinal,
  notifyGoal,
  notifyKickoffWarning,
  notifyMissedPenalty,
  notifyRedCard,
  pickRecipients,
} from "@/lib/notify";
import { resolveKnockoutPlaceholders } from "@/lib/knockout";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TournamentSummary = {
  slug: string;
  fetched: number;
  autoMapped: number;
  updated: number;
  skippedAdmin: number;
  skippedNotFinal: number;
  knockoutResolved: number[];
  notified: {
    kickoff: number;
    ft: number;
    goal: number;
    redCard: number;
    missedPenalty: number;
  };
  error?: string;
};

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// Disparo del recordatorio cuando el kickoff cae entre +5 y +20 min desde
// `now`. Ventana relativamente amplia para tolerar lag del cron (best-effort).
function isInKickoffWindow(kickoffAt: Date, now: Date): boolean {
  const ms = kickoffAt.getTime() - now.getTime();
  return ms >= 5 * 60_000 && ms <= 20 * 60_000;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const all = await db.select().from(tournaments);
  const targets = all.filter(
    (t) =>
      t.apiLeagueId &&
      t.apiSeason &&
      (t.status === "live" || t.status === "upcoming")
  );

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const from = yesterday.toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);

  const summary: TournamentSummary[] = [];

  for (const t of targets) {
    const s: TournamentSummary = {
      slug: t.slug,
      fetched: 0,
      autoMapped: 0,
      updated: 0,
      skippedAdmin: 0,
      skippedNotFinal: 0,
      knockoutResolved: [],
      notified: { kickoff: 0, ft: 0, goal: 0, redCard: 0, missedPenalty: 0 },
    };

    let fixtures: ApiFixture[];
    try {
      fixtures = await getFixturesByDateRange(
        t.apiLeagueId!,
        t.apiSeason!,
        from,
        to
      );
    } catch (e) {
      s.error = (e as Error).message;
      summary.push(s);
      continue;
    }
    s.fetched = fixtures.length;

    const tMatches = await db
      .select()
      .from(matches)
      .where(
        and(eq(matches.tournamentId, t.id), isNotNull(matches.apiFixtureId))
      );
    const byApiId = new Map<number, Match>();
    for (const m of tMatches) {
      if (m.apiFixtureId) byApiId.set(m.apiFixtureId, m);
    }

    // ─── Auto-mapeo de apiFixtureId para partidos de eliminatoria ────────
    // Los partidos KO se insertan como placeholders sin apiFixtureId.
    // Una vez que sus equipos se resuelven (homeCode/awayCode != null), el
    // cron intenta emparejarlos con los fixtures de API-Football usando el
    // par (homeApiTeamId, awayApiTeamId). Así no hace falta ejecutar
    // db:map-api manualmente cada vez que avanza una ronda.
    try {
      const unmapped = await db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.tournamentId, t.id),
            isNull(matches.apiFixtureId),
            isNotNull(matches.homeCode),
            isNotNull(matches.awayCode)
          )
        );

      if (unmapped.length > 0) {
        const allCodes = new Set<string>();
        for (const m of unmapped) {
          if (m.homeCode) allCodes.add(m.homeCode);
          if (m.awayCode) allCodes.add(m.awayCode);
        }
        const teamRows = await db
          .select({ code: teams.code, apiTeamId: teams.apiTeamId })
          .from(teams)
          .where(and(eq(teams.tournamentId, t.id), isNotNull(teams.apiTeamId)));
        const teamIdByCode = new Map<string, number>();
        for (const tr of teamRows) {
          if (tr.apiTeamId) teamIdByCode.set(tr.code, tr.apiTeamId);
        }

        // Mapa (homeApiTeamId, awayApiTeamId) → match para emparejar
        const byTeamPair = new Map<string, Match>();
        for (const m of unmapped) {
          if (!m.homeCode || !m.awayCode) continue;
          const homeId = teamIdByCode.get(m.homeCode);
          const awayId = teamIdByCode.get(m.awayCode);
          if (!homeId || !awayId) continue;
          byTeamPair.set(`${homeId}-${awayId}`, m);
        }

        for (const fx of fixtures) {
          if (byApiId.has(fx.fixture.id)) continue;
          const key = `${fx.teams.home.id}-${fx.teams.away.id}`;
          const m = byTeamPair.get(key);
          if (!m) continue;
          await db
            .update(matches)
            .set({ apiFixtureId: fx.fixture.id })
            .where(eq(matches.id, m.id));
          const mapped: Match = { ...m, apiFixtureId: fx.fixture.id };
          byApiId.set(fx.fixture.id, mapped);
          tMatches.push(mapped);
          byTeamPair.delete(key);
          s.autoMapped++;
          console.log(
            `[cron] Auto-mapeado fixture ${fx.fixture.id} → partido ${m.matchNumber} (${m.homeCode} vs ${m.awayCode})`
          );
        }
      }
    } catch (e) {
      console.warn(`[cron] auto-mapeo falló para ${t.slug}: ${(e as Error).message}`);
    }

    // Audiencia compartida por todos los eventos de este torneo: usuarios
    // suscritos a push que estén en algún grupo del torneo.
    let recipients: number[] = [];
    try {
      recipients = await pickRecipients(t.id);
    } catch (e) {
      // No bloqueante: si no podemos resolver audiencia, seguimos con
      // updates de score pero sin push.
      console.warn(
        `[cron] pickRecipients falló para ${t.slug}: ${(e as Error).message}`
      );
    }

    // ─── Kickoff warning ────────────────────────────────────────────────
    // Recorremos NUESTROS matches (no los de la API) porque queremos avisar
    // aunque API-Football no haya publicado el fixture en su /fixtures de hoy.
    for (const m of tMatches) {
      if (!isInKickoffWindow(m.kickoffAt, now)) continue;
      if (recipients.length === 0) continue;
      const sent = await notifyKickoffWarning(m, recipients);
      if (sent) s.notified.kickoff++;
    }

    // ─── Score update: FT (definitivo) + en directo (parcial) ──────────────
    // Para FT/AET/PEN usamos score.fulltime (definitivo) y enviamos push.
    // Para 1H/HT/2H/ET/BT/P usamos goals.home/away (score actual) sin push,
    // para que el leaderboard se actualice durante el partido, no solo al final.
    for (const fx of fixtures) {
      const ours = byApiId.get(fx.fixture.id);
      if (!ours) continue;
      if (ours.resultSource === "admin") {
        s.skippedAdmin++;
        continue;
      }
      const isFinal = isFinalScore(fx.fixture.status);
      const currentlyLive = isLive(fx.fixture.status);
      if (!isFinal && !currentlyLive) {
        s.skippedNotFinal++;
        continue;
      }
      const home = isFinal ? fx.score.fulltime.home : fx.goals.home;
      const away = isFinal ? fx.score.fulltime.away : fx.goals.away;
      if (home === null || away === null) continue;

      // AET/PEN: score.extratime = marcador acumulado tras prórroga (120').
      // score.penalty = resultado de la tanda de penaltis.
      const statusShort = fx.fixture.status.short;
      const homeAet = isFinal && (statusShort === "AET" || statusShort === "PEN")
        ? fx.score.extratime.home
        : null;
      const awayAet = isFinal && (statusShort === "AET" || statusShort === "PEN")
        ? fx.score.extratime.away
        : null;
      const penHome = isFinal && statusShort === "PEN" ? fx.score.penalty.home : null;
      const penAway = isFinal && statusShort === "PEN" ? fx.score.penalty.away : null;

      const scoreChanged =
        ours.homeScore !== home || ours.awayScore !== away ||
        ours.homeScoreAet !== homeAet || ours.awayScoreAet !== awayAet ||
        ours.penaltyHome !== penHome || ours.penaltyAway !== penAway;
      if (scoreChanged) {
        await db
          .update(matches)
          .set({
            homeScore: home,
            awayScore: away,
            homeScoreAet: homeAet,
            awayScoreAet: awayAet,
            penaltyHome: penHome,
            penaltyAway: penAway,
            resultSource: "api",
          })
          .where(eq(matches.id, ours.id));
        s.updated++;
      }
      if (isFinal && recipients.length > 0) {
        const sent = await notifyFinal(ours, home, away, recipients);
        if (sent) s.notified.ft++;
      }
    }

    // ─── Resolver huecos de eliminatoria que ya tengan equipo conocido ───
    try {
      s.knockoutResolved = await resolveKnockoutPlaceholders(t.id);
    } catch (e) {
      console.warn(
        `[cron] resolveKnockoutPlaceholders falló para ${t.slug}: ${(e as Error).message}`
      );
    }

    // ─── Eventos en directo (gol / roja / penalti fallado) ───────────────
    const liveFixtures = fixtures.filter((fx) => isLive(fx.fixture.status));
    for (const fx of liveFixtures) {
      const ours = byApiId.get(fx.fixture.id);
      if (!ours) continue;
      if (recipients.length === 0) continue;

      let events: Awaited<ReturnType<typeof getFixtureEvents>>;
      try {
        events = await getFixtureEvents(fx.fixture.id, { revalidate: 30 });
      } catch (e) {
        console.warn(
          `[cron] events fallo (${fx.fixture.id}): ${(e as Error).message}`
        );
        continue;
      }

      // Recorremos en orden cronológico. Mantenemos un cómputo local del
      // marcador parcial para incluirlo en la notificación del gol —
      // entre gol y gol cambia y queremos mostrar el correcto.
      let runningHome = 0;
      let runningAway = 0;
      const sorted = [...events].sort(
        (a, b) =>
          a.time.elapsed +
          (a.time.extra ?? 0) -
          (b.time.elapsed + (b.time.extra ?? 0))
      );

      for (const ev of sorted) {
        const minute = ev.time.elapsed;
        const extra = ev.time.extra;
        const playerName = ev.player.name ?? "—";
        const teamName = ev.team.name;
        const isHomeTeam = ev.team.id === fx.teams.home.id;

        if (ev.type === "Goal" && ev.detail !== "Missed Penalty") {
          // El "Own Goal" en la API se atribuye al equipo CONTRA el que va el
          // gol. Para el marcador parcial sumamos al rival.
          if (ev.detail === "Own Goal") {
            if (isHomeTeam) runningAway++;
            else runningHome++;
          } else {
            if (isHomeTeam) runningHome++;
            else runningAway++;
          }
          const sent = await notifyGoal(ours, recipients, {
            minute,
            extra,
            player: playerName,
            teamName,
            scoreHome: runningHome,
            scoreAway: runningAway,
            detail: ev.detail,
          });
          if (sent) s.notified.goal++;
        } else if (
          ev.type === "Goal" &&
          ev.detail === "Missed Penalty"
        ) {
          const sent = await notifyMissedPenalty(ours, recipients, {
            minute,
            extra,
            player: playerName,
            teamName,
          });
          if (sent) s.notified.missedPenalty++;
        } else if (ev.type === "Card" && ev.detail.includes("Red")) {
          const sent = await notifyRedCard(ours, recipients, {
            minute,
            extra,
            player: playerName,
            teamName,
          });
          if (sent) s.notified.redCard++;
        }
      }
    }

    summary.push(s);
  }

  return NextResponse.json({
    ok: true,
    window: { from, to },
    summary,
  });
}
