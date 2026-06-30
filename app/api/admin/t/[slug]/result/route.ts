import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { resolveKnockoutPlaceholders } from "@/lib/knockout";

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session || !session.isGlobalAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { matchId, homeScore, awayScore, homeScoreAet, awayScoreAet, penaltyHome, penaltyAway } = await req.json();
    if (!Number.isInteger(matchId)) {
      return NextResponse.json({ error: "matchId inválido" }, { status: 400 });
    }

    const validOptInt = (v: unknown) =>
      v === null || v === undefined || (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 30);

    if (!validOptInt(homeScore) || !validOptInt(awayScore) ||
        !validOptInt(homeScoreAet) || !validOptInt(awayScoreAet) ||
        !validOptInt(penaltyHome) || !validOptInt(penaltyAway)) {
      return NextResponse.json({ error: "Marcador inválido" }, { status: 400 });
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
    const clearing = homeScore === null && awayScore === null;
    const resultSource = clearing ? null : "admin";

    const result = await db
      .update(matches)
      .set({
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
        homeScoreAet: clearing ? null : (homeScoreAet ?? null),
        awayScoreAet: clearing ? null : (awayScoreAet ?? null),
        penaltyHome: clearing ? null : (penaltyHome ?? null),
        penaltyAway: clearing ? null : (penaltyAway ?? null),
        resultSource,
      })
      .where(and(eq(matches.id, matchId), eq(matches.tournamentId, tournament.id)))
      .returning({ id: matches.id });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Partido no encontrado en este torneo" },
        { status: 404 }
      );
    }

    // Propaga el resultado a los cruces de eliminatoria downstream de inmediato.
    await resolveKnockoutPlaceholders(tournament.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
