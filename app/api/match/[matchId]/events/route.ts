// GET /api/match/[matchId]/events
// Eventos del partido (goles, tarjetas, cambios, VAR). Requiere sesión.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getFixtureEvents, matchCacheTtl } from "@/lib/api-football";

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

  // Eventos cambian rápido en directo (gol cada X minutos): liveTtl 30s.
  const ttl = matchCacheTtl(
    m.kickoffAt,
    m.homeScore !== null && m.awayScore !== null
  );

  try {
    const events = await getFixtureEvents(m.apiFixtureId, { revalidate: ttl });
    return NextResponse.json({ ok: true, events }, {
      headers: { "Cache-Control": `private, max-age=${ttl}` },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 }
    );
  }
}
