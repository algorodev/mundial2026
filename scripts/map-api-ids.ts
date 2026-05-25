// Mapea los IDs de API-Football a nuestros torneos/equipos/partidos.
//
// Para cada torneo con `apiLeagueId` y `apiSeason`:
//   1. /teams?league=L&season=S → rellena teams.apiTeamId + teams.logoUrl
//      casando por team.code === teams.code (case-insensitive). Reporta
//      huecos para que el admin los resuelva (override manual).
//   2. /fixtures?league=L&season=S → rellena matches.apiFixtureId casando
//      por (apiHomeTeamId, apiAwayTeamId) + mismo día UTC del kickoff.
//
// Idempotente: re-ejecutar no hace daño, sólo refresca.
//
// Uso:
//   pnpm db:map-api                  # todos los torneos configurados
//   pnpm db:map-api mundial-2026     # sólo el slug dado

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { matches, teams, tournaments } from "../lib/db/schema";
import {
  getFixturesByLeague,
  getTeamsByLeague,
  type ApiFixture,
  type ApiTeamSummary,
} from "../lib/api-football";
import type { Tournament } from "../lib/db/schema";

// Overrides manuales: cuando team.code de la API no coincide con el nuestro
// (típico en clubes), añade aquí `slug-de-torneo` → `{ ourCode: apiTeamId }`.
// Para Mundial los códigos FIFA suelen coincidir; para LaLiga/Champions hará
// falta llenarlo. Vacío por ahora — el script reporta huecos para que se vea.
const TEAM_OVERRIDES: Record<string, Record<string, number>> = {
  // "laliga-2026-27": { REA: 541, BAR: 529, ATM: 530, ... },
};

async function mapTeams(t: Tournament): Promise<Map<string, number>> {
  // Devuelve un map de ourCode → apiTeamId, para usar después al mapear fixtures.
  if (!t.apiLeagueId || !t.apiSeason) return new Map();

  const ours = await db
    .select()
    .from(teams)
    .where(eq(teams.tournamentId, t.id));

  if (ours.length === 0) {
    console.log(`   ℹ️  No hay equipos cargados todavía (¿seed pendiente?)`);
    return new Map();
  }

  console.log(`   📡 /teams?league=${t.apiLeagueId}&season=${t.apiSeason}`);
  let apiTeams: ApiTeamSummary[];
  try {
    apiTeams = await getTeamsByLeague(t.apiLeagueId, t.apiSeason);
  } catch (e) {
    console.warn(`   ⚠️  Fallo: ${(e as Error).message}`);
    return new Map();
  }
  console.log(`   ↳ API devolvió ${apiTeams.length} equipos`);

  const overrides = TEAM_OVERRIDES[t.slug] ?? {};
  const result = new Map<string, number>();
  let matched = 0;
  const unmatched: string[] = [];

  for (const ourTeam of ours) {
    let apiId: number | undefined = overrides[ourTeam.code];
    let logoUrl: string | null = ourTeam.logoUrl;

    if (!apiId) {
      const found = apiTeams.find(
        (a) =>
          (a.team.code ?? "").toUpperCase() === ourTeam.code.toUpperCase()
      );
      if (found) {
        apiId = found.team.id;
        logoUrl = found.team.logo;
      }
    } else {
      // Si hay override, sigue trayendo el logo de la API si lo encontramos.
      const found = apiTeams.find((a) => a.team.id === apiId);
      if (found) logoUrl = found.team.logo;
    }

    if (!apiId) {
      unmatched.push(`${ourTeam.code} (${ourTeam.name})`);
      continue;
    }

    await db
      .update(teams)
      .set({ apiTeamId: apiId, logoUrl })
      .where(eq(teams.id, ourTeam.id));
    result.set(ourTeam.code, apiId);
    matched++;
  }

  console.log(`   ✅ Equipos casados: ${matched}/${ours.length}`);
  if (unmatched.length > 0) {
    console.log(`   ⚠️  Sin casar (${unmatched.length}):`);
    for (const u of unmatched) console.log(`        · ${u}`);
    console.log(
      `      → Añade overrides en scripts/map-api-ids.ts: TEAM_OVERRIDES["${t.slug}"]`
    );
  }
  return result;
}

async function mapFixtures(
  t: Tournament,
  codeToApiTeamId: Map<string, number>
) {
  if (!t.apiLeagueId || !t.apiSeason) return;
  if (codeToApiTeamId.size === 0) {
    console.log(`   ⏭️  Sin equipos casados, no mapeo fixtures`);
    return;
  }

  const ours = await db
    .select()
    .from(matches)
    .where(eq(matches.tournamentId, t.id));

  if (ours.length === 0) {
    console.log(`   ℹ️  No hay partidos cargados todavía`);
    return;
  }

  console.log(`   📡 /fixtures?league=${t.apiLeagueId}&season=${t.apiSeason}`);
  let apiFixtures: ApiFixture[];
  try {
    apiFixtures = await getFixturesByLeague(t.apiLeagueId, t.apiSeason);
  } catch (e) {
    console.warn(`   ⚠️  Fallo: ${(e as Error).message}`);
    return;
  }
  console.log(`   ↳ API devolvió ${apiFixtures.length} fixtures`);

  // Index fixtures: (apiHomeTeamId|apiAwayTeamId|YYYY-MM-DD UTC) → fixture
  const fxIndex = new Map<string, ApiFixture>();
  for (const fx of apiFixtures) {
    const day = fx.fixture.date.slice(0, 10);
    const key = `${fx.teams.home.id}|${fx.teams.away.id}|${day}`;
    fxIndex.set(key, fx);
  }

  let matched = 0;
  const unmatched: string[] = [];

  for (const m of ours) {
    if (!m.homeCode || !m.awayCode) {
      unmatched.push(`#${m.matchNumber} sin homeCode/awayCode`);
      continue;
    }
    const homeApiId = codeToApiTeamId.get(m.homeCode);
    const awayApiId = codeToApiTeamId.get(m.awayCode);
    if (!homeApiId || !awayApiId) {
      unmatched.push(
        `#${m.matchNumber} ${m.homeCode}-${m.awayCode} (códigos sin apiTeamId)`
      );
      continue;
    }
    const day = m.kickoffAt.toISOString().slice(0, 10);
    // Buscamos primero el día exacto. Si no, intentamos ±1 día porque
    // la zona horaria puede mover la fecha local de la API respecto a la nuestra.
    let fx =
      fxIndex.get(`${homeApiId}|${awayApiId}|${day}`) ??
      shiftDay(fxIndex, homeApiId, awayApiId, day, -1) ??
      shiftDay(fxIndex, homeApiId, awayApiId, day, 1);

    if (!fx) {
      unmatched.push(
        `#${m.matchNumber} ${m.homeTeam}-${m.awayTeam} (${day})`
      );
      continue;
    }

    if (m.apiFixtureId !== fx.fixture.id) {
      await db
        .update(matches)
        .set({ apiFixtureId: fx.fixture.id })
        .where(eq(matches.id, m.id));
    }
    matched++;
  }

  console.log(`   ✅ Fixtures casados: ${matched}/${ours.length}`);
  if (unmatched.length > 0) {
    console.log(`   ⚠️  Sin casar (${unmatched.length}):`);
    for (const u of unmatched.slice(0, 10)) console.log(`        · ${u}`);
    if (unmatched.length > 10) {
      console.log(`        … y ${unmatched.length - 10} más`);
    }
  }
}

function shiftDay(
  fxIndex: Map<string, ApiFixture>,
  home: number,
  away: number,
  isoDay: string,
  delta: number
): ApiFixture | undefined {
  const d = new Date(`${isoDay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  const day = d.toISOString().slice(0, 10);
  return fxIndex.get(`${home}|${away}|${day}`);
}

async function main() {
  const slugFilter = process.argv[2];
  const all = await db.select().from(tournaments);
  const configured = all.filter((t) => t.apiLeagueId && t.apiSeason);
  const targets = slugFilter
    ? configured.filter((t) => t.slug === slugFilter)
    : configured;

  if (targets.length === 0) {
    if (slugFilter) {
      console.error(
        `❌ Torneo "${slugFilter}" no encontrado o sin apiLeagueId/apiSeason.`
      );
    } else {
      console.log(
        "ℹ️  Ningún torneo configurado con apiLeagueId/apiSeason. " +
          "Corre `pnpm db:seed` primero."
      );
    }
    process.exit(slugFilter ? 1 : 0);
  }

  console.log(`🔗 Mapeando IDs de API-Football a ${targets.length} torneo(s)`);
  for (const t of targets) {
    console.log(`\n🏆 ${t.name} [${t.slug}]`);
    const teamMap = await mapTeams(t);
    await mapFixtures(t, teamMap);
  }
  console.log("\n🎉 Mapeo completado");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
