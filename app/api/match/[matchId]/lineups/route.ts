// GET /api/match/[matchId]/lineups
// Devuelve las alineaciones del partido (XI titular + suplentes por equipo),
// cacheadas con Next según el momento del partido. Requiere sesión.
//
// Status:
//   401 → sin sesión
//   404 → matchId no existe
//   422 → match sin apiFixtureId (no mapeado a API-Football)
//   200 → { ok: true, lineups: ApiLineup[] }
//   502 → fallo al llamar API-Football

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getFixtureLineups, matchCacheTtl } from "@/lib/api-football";

export const dynamic = "force-dynamic";

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
  if (!m.apiFixtureId) {
    return NextResponse.json(
      { error: "partido no mapeado a API-Football" },
      { status: 422 }
    );
  }

  // Lineups no cambian una vez publicadas (45-60 min antes del kickoff). En
  // directo damos liveTtl alto (5 min) — sólo cambian si hay cambio.
  const ttl = matchCacheTtl(
    m.kickoffAt,
    m.homeScore !== null && m.awayScore !== null,
    { liveTtl: 300 }
  );

  try {
    const lineups = await getFixtureLineups(m.apiFixtureId, { revalidate: ttl });
    return NextResponse.json({ ok: true, lineups }, {
      headers: { "Cache-Control": `private, max-age=${ttl}` },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 }
    );
  }
}
