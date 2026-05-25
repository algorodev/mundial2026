// GET /api/tournaments/[slug]/standings
// Clasificación del torneo (grupos en Mundial, tabla única en liga, etc.)
// Requiere sesión.
//
// TTL adaptado al status del torneo:
//   live      → 5 min (los puntos cambian con cada FT)
//   upcoming  → 24h (no hay nada todavía; la API devuelve la estructura vacía)
//   finished  → 24h (no cambia)

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getStandings } from "@/lib/api-football";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const { slug } = await props.params;

  const [t] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, slug))
    .limit(1);
  if (!t) {
    return NextResponse.json({ error: "torneo no encontrado" }, { status: 404 });
  }
  if (!t.apiLeagueId || !t.apiSeason) {
    return NextResponse.json(
      { error: "torneo no configurado para API-Football" },
      { status: 422 }
    );
  }

  const ttl = t.status === "live" ? 300 : 24 * 60 * 60;

  try {
    const standings = await getStandings(t.apiLeagueId, t.apiSeason, {
      revalidate: ttl,
    });
    return NextResponse.json({ ok: true, standings }, {
      headers: { "Cache-Control": `private, max-age=${ttl}` },
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 }
    );
  }
}
