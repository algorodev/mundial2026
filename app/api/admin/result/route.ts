import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { matchId, homeScore, awayScore } = await req.json();
    if (!Number.isInteger(matchId)) {
      return NextResponse.json({ error: "matchId inválido" }, { status: 400 });
    }

    // Permitir borrar resultado pasando null
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

    await db
      .update(matches)
      .set({ homeScore, awayScore })
      .where(eq(matches.id, matchId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
