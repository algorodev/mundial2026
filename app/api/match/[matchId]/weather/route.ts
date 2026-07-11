// GET /api/match/[matchId]/weather
// Clima previsto en la sede del partido (Open-Meteo, sin API key). Requiere
// sesión, igual que el resto de /api/match/[matchId]/*.
//
// A diferencia de lineups/events/h2h no depende de apiFixtureId — usa
// matches.stadium (nuestro dato local) para resolver lat/lon en
// lib/venues-2026.ts. Devuelve { ok: true, weather: null } (no error) cuando
// no hay sede mapeada o el kickoff está fuera de la ventana de forecast de
// Open-Meteo (~16 días) — es un estado esperado, no un fallo.

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { venueForStadium } from "@/lib/venues-2026";
import { getVenueWeather } from "@/lib/weather";

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

  const [m] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!m) {
    return NextResponse.json({ error: "partido no encontrado" }, { status: 404 });
  }

  const venue = venueForStadium(m.stadium);
  if (!venue) {
    return NextResponse.json({ ok: true, weather: null });
  }

  try {
    const weather = await getVenueWeather(venue.lat, venue.lon, m.kickoffAt.toISOString());
    return NextResponse.json({ ok: true, weather });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
