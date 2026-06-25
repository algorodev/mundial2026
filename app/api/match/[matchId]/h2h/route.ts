// GET /api/match/[matchId]/h2h
// Últimos enfrentamientos entre los dos equipos del partido. Requiere sesión.
//
// Estrategia de cache:
//   - Busca en h2h_cache por (min, max) de los dos apiTeamIds.
//   - Si existe y tiene menos de 24h → sirve desde DB.
//   - Si no existe o está expirado → llama a API, guarda en DB y sirve.
//
// El par de IDs se normaliza (teamAId < teamBId) para que ESP vs FRA y
// FRA vs ESP usen la misma fila.

import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams, h2hCache } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getHeadToHead } from "@/lib/api-football";

export const dynamic = "force-dynamic";

const H2H_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const H2H_LAST = 10;

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const { matchId: matchIdStr } = await props.params;
  const matchId = Number(matchIdStr);
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return NextResponse.json({ error: "matchId inválido" }, { status: 400 });
  }

  const [m] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!m) {
    return NextResponse.json({ error: "partido no encontrado" }, { status: 404 });
  }
  if (!m.homeCode || !m.awayCode) {
    return NextResponse.json({ error: "partido sin códigos de equipo" }, { status: 422 });
  }

  const tTeams = await db
    .select()
    .from(teams)
    .where(
      and(
        eq(teams.tournamentId, m.tournamentId),
        inArray(teams.code, [m.homeCode, m.awayCode])
      )
    );
  const home = tTeams.find((t) => t.code === m.homeCode);
  const away = tTeams.find((t) => t.code === m.awayCode);
  if (!home?.apiTeamId || !away?.apiTeamId) {
    return NextResponse.json({ error: "equipos no mapeados a API-Football" }, { status: 422 });
  }

  // Normalizar el par para que el cache sea simétrico.
  const teamAId = Math.min(home.apiTeamId, away.apiTeamId);
  const teamBId = Math.max(home.apiTeamId, away.apiTeamId);

  // Intentar servir desde DB cache.
  const [cached] = await db
    .select()
    .from(h2hCache)
    .where(and(eq(h2hCache.teamAId, teamAId), eq(h2hCache.teamBId, teamBId)))
    .limit(1);

  if (cached && Date.now() - cached.updatedAt.getTime() < H2H_TTL_MS) {
    return NextResponse.json({ ok: true, h2h: JSON.parse(cached.fixturesJson) });
  }

  // Cache expirado o inexistente: llamar a la API y persistir.
  try {
    const h2h = await getHeadToHead(home.apiTeamId, away.apiTeamId, H2H_LAST);

    await db
      .insert(h2hCache)
      .values({ teamAId, teamBId, fixturesJson: JSON.stringify(h2h), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [h2hCache.teamAId, h2hCache.teamBId],
        set: { fixturesJson: JSON.stringify(h2h), updatedAt: new Date() },
      });

    return NextResponse.json({ ok: true, h2h });
  } catch (e) {
    // Si la API falla pero tenemos datos en DB (aunque expirados), los usamos.
    if (cached) {
      return NextResponse.json({ ok: true, h2h: JSON.parse(cached.fixturesJson) });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
