import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { matches, teams, tournaments, users } from "../lib/db/schema";
import type { MatchData } from "../lib/matches-data";
import { MATCHES, flagToCode } from "../lib/matches-data";
import {
  CHAMPIONS_2026_SLUG,
  CHAMPIONS_2026_NAME,
  CHAMPIONS_2026_MATCHES,
  CHAMPIONS_2026_CODES,
} from "../lib/champions-2026-data";
import {
  LALIGA_2026_27_SLUG,
  LALIGA_2026_27_NAME,
  LALIGA_2026_27_MATCHES,
  LALIGA_2026_27_CODES,
} from "../lib/laliga-2026-27-data";

type SeedTournament = {
  slug: string;
  name: string;
  sport: string;
  // draft     → torneo creado pero todavía sin calendario; no acepta inscripciones
  // upcoming  → calendario publicado, los grupos pueden inscribirse, aún no ha arrancado
  // live      → en curso
  // finished  → terminado
  status: "draft" | "upcoming" | "live" | "finished";
  matchData: MatchData[];
  // Resolver el código de equipo a partir del nombre o emoji del partido.
  resolveCode: (m: MatchData, side: "home" | "away") => string | null;
  // Integración API-Football. Si están definidas, scripts/map-api-ids.ts
  // y los crons de resultados toman este torneo.
  apiLeagueId?: number;
  apiSeason?: number;
};

const TOURNAMENTS: SeedTournament[] = [
  {
    slug: "mundial-2026",
    name: "Mundial 2026",
    sport: "futbol",
    status: "upcoming",
    matchData: MATCHES,
    resolveCode: (m, side) =>
      flagToCode(side === "home" ? m.homeFlag : m.awayFlag),
    apiLeagueId: 1, // World Cup
    apiSeason: 2026,
  },
  {
    slug: CHAMPIONS_2026_SLUG,
    name: CHAMPIONS_2026_NAME,
    sport: "futbol",
    status: "live",
    matchData: CHAMPIONS_2026_MATCHES,
    resolveCode: (m, side) =>
      CHAMPIONS_2026_CODES[side === "home" ? m.home : m.away] ?? null,
    apiLeagueId: 2, // UEFA Champions League
    apiSeason: 2025, // temporada 2025-26
  },
  {
    slug: LALIGA_2026_27_SLUG,
    name: LALIGA_2026_27_NAME,
    sport: "futbol",
    status: "draft",
    matchData: LALIGA_2026_27_MATCHES,
    resolveCode: (m, side) =>
      LALIGA_2026_27_CODES[side === "home" ? m.home : m.away] ?? null,
    apiLeagueId: 140, // LaLiga
    apiSeason: 2026,
  },
];

async function ensureTournament(t: SeedTournament) {
  let [row] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, t.slug))
    .limit(1);

  if (!row) {
    [row] = await db
      .insert(tournaments)
      .values({
        slug: t.slug,
        name: t.name,
        sport: t.sport,
        status: t.status,
        apiLeagueId: t.apiLeagueId,
        apiSeason: t.apiSeason,
      })
      .returning();
    console.log(`✅ Torneo creado: ${row.name}`);
  } else {
    // Mantener la config API al día sin pisar nombre/estado (que el admin
    // puede haber cambiado a mano).
    if (
      (t.apiLeagueId !== undefined && row.apiLeagueId !== t.apiLeagueId) ||
      (t.apiSeason !== undefined && row.apiSeason !== t.apiSeason)
    ) {
      [row] = await db
        .update(tournaments)
        .set({ apiLeagueId: t.apiLeagueId, apiSeason: t.apiSeason })
        .where(eq(tournaments.id, row.id))
        .returning();
      console.log(`🔁 Torneo actualizado (API config): ${row.name}`);
    } else {
      console.log(`ℹ️  Torneo ya existe: ${row.name}`);
    }
  }
  return row;
}

async function upsertTeams(t: SeedTournament, tournamentId: number) {
  // Deducir equipos únicos del match data. Para Mundial: bandera + código FIFA;
  // para Champions/LaLiga: sin bandera, sólo nombre + código de club.
  const seen = new Map<
    string,
    { code: string; name: string; flagEmoji: string | null }
  >();
  for (const m of t.matchData) {
    for (const side of ["home", "away"] as const) {
      const code = t.resolveCode(m, side);
      if (!code) continue;
      if (seen.has(code)) continue;
      const name = side === "home" ? m.home : m.away;
      const flagEmoji = side === "home" ? m.homeFlag : m.awayFlag;
      seen.set(code, { code, name, flagEmoji: flagEmoji ?? null });
    }
  }
  if (seen.size === 0) return;
  for (const team of seen.values()) {
    await db
      .insert(teams)
      .values({
        tournamentId,
        code: team.code,
        name: team.name,
        flagEmoji: team.flagEmoji,
      })
      .onConflictDoUpdate({
        target: [teams.tournamentId, teams.code],
        set: { name: team.name, flagEmoji: team.flagEmoji },
        // OJO: deliberadamente no tocamos apiTeamId/logoUrl porque los
        // rellena scripts/map-api-ids.ts y no queremos perderlos aquí.
      });
  }
  console.log(`✅ ${seen.size} equipos cargados`);
}

async function upsertMatches(t: SeedTournament, tournamentId: number) {
  console.log(`📅 Cargando ${t.matchData.length} partidos de ${t.name}...`);
  for (const m of t.matchData) {
    const homeCode = t.resolveCode(m, "home");
    const awayCode = t.resolveCode(m, "away");
    await db
      .insert(matches)
      .values({
        tournamentId,
        matchNumber: m.num,
        matchDate: m.date,
        matchTime: m.time,
        kickoffAt: new Date(m.iso),
        groupName: m.group,
        homeTeam: m.home,
        awayTeam: m.away,
        homeCode,
        awayCode,
        homeFlag: m.homeFlag,
        awayFlag: m.awayFlag,
        stadium: m.stadium,
      })
      .onConflictDoUpdate({
        target: [matches.tournamentId, matches.matchNumber],
        set: {
          matchDate: m.date,
          matchTime: m.time,
          groupName: m.group,
          homeTeam: m.home,
          awayTeam: m.away,
          homeCode,
          awayCode,
          homeFlag: m.homeFlag,
          awayFlag: m.awayFlag,
          stadium: m.stadium,
          // OJO: deliberadamente no tocamos kickoffAt/homeScore/awayScore
          // para no pisar resultados ya metidos ni el simulador.
        },
      });
  }
  console.log("✅ Partidos cargados");
}

async function promoteAdminEmail() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!adminEmail) {
    console.log(
      "ℹ️  ADMIN_EMAIL no definido. Para tener admin global: defínelo y vuelve a ejecutar."
    );
    return;
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existing) {
    if (existing.isGlobalAdmin !== 1) {
      await db
        .update(users)
        .set({ isGlobalAdmin: 1 })
        .where(eq(users.id, existing.id));
      console.log(`✅ ${adminEmail} promocionado a global admin`);
    } else {
      console.log(`ℹ️  ${adminEmail} ya es global admin`);
    }
  } else {
    await db.insert(users).values({
      email: adminEmail,
      name: adminEmail.split("@")[0],
      isGlobalAdmin: 1,
    });
    console.log(`✅ Admin creado en frío: ${adminEmail}`);
    console.log(
      "   (Aún sin contraseña — entrará al pedir el enlace de \"Crear contraseña\" desde /login)"
    );
  }
}

async function main() {
  console.log("🌱 Seeding base de datos...");

  for (const t of TOURNAMENTS) {
    const row = await ensureTournament(t);
    await upsertTeams(t, row.id);
    await upsertMatches(t, row.id);
  }

  await promoteAdminEmail();

  console.log("🎉 Seed completado");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
