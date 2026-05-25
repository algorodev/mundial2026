// GET /api/match/[matchId]/h2h
// Últimos enfrentamientos entre los dos equipos del partido. Requiere sesión.
//
// Resolución de team IDs:
//   match.homeCode + match.tournamentId → teams.apiTeamId
//   match.awayCode + match.tournamentId → teams.apiTeamId
// Si falta cualquiera de los dos, 422 con mensaje claro.

import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getHeadToHead } from "@/lib/api-football";

export const dynamic = "force-dynamic";

const H2H_TTL = 24 * 60 * 60; // 24h: el historial sólo cambia cuando juegan
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

  const [m] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!m) {
    return NextResponse.json({ error: "partido no encontrado" }, { status: 404 });
  }
  if (!m.homeCode || !m.awayCode) {
    return NextResponse.json(
      { error: "partido sin códigos de equipo" },
      { status: 422 }
    );
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
    return NextResponse.json(
      { error: "equipos no mapeados a API-Football" },
      { status: 422 }
    );
  }

  try {
    const h2h = await getHeadToHead(home.apiTeamId, away.apiTeamId, H2H_LAST, {
      revalidate: H2H_TTL,
    });
    return NextResponse.json({ ok: true, h2h }, {
      headers: { "Cache-Control": `private, max-age=${H2H_TTL}` },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 }
    );
  }
}
