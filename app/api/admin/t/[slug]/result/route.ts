import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session || !session.isGlobalAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { matchId, homeScore, awayScore } = await req.json();
    if (!Number.isInteger(matchId)) {
      return NextResponse.json({ error: "matchId inválido" }, { status: 400 });
    }

    const validHome =
      homeScore === null ||
      (Number.isInteger(homeScore) && homeScore >= 0 && homeScore <= 20);
    const validAway =
      awayScore === null ||
      (Number.isInteger(awayScore) && awayScore >= 0 && awayScore <= 20);

    if (!validHome || !validAway) {
      return NextResponse.json(
        { error: "Marcador inválido" },
        { status: 400 }
      );
    }

    const [tournament] = await db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.slug, params.slug))
      .limit(1);

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    // resultSource: 'admin' cuando se fija un marcador, null cuando se borra
    // (para que el cron de auto-resultados pueda volver a poblarlo).
    const resultSource =
      homeScore === null && awayScore === null ? null : "admin";

    const result = await db
      .update(matches)
      .set({ homeScore, awayScore, resultSource })
      .where(and(eq(matches.id, matchId), eq(matches.tournamentId, tournament.id)))
      .returning({ id: matches.id });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Partido no encontrado en este torneo" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
