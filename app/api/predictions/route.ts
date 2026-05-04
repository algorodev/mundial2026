import { NextRequest, NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { predictions, matches } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

// GET: predicciones del usuario logado
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(predictions)
    .where(eq(predictions.userId, session.userId));

  return NextResponse.json({ predictions: rows });
}

// POST: guardar/actualizar una predicción
// Solo se puede modificar si el partido aún no ha empezado.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { matchId, homeScore, awayScore } = body;

    if (
      !Number.isInteger(matchId) ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0 ||
      homeScore > 20 ||
      awayScore > 20
    ) {
      return NextResponse.json(
        { error: "Datos no válidos" },
        { status: 400 }
      );
    }

    // Validar que el partido existe y aún no ha empezado
    const m = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (m.length === 0) {
      return NextResponse.json(
        { error: "Partido no encontrado" },
        { status: 404 }
      );
    }

    if (new Date() >= m[0].kickoffAt) {
      return NextResponse.json(
        { error: "Este partido ya ha comenzado, no se puede modificar" },
        { status: 403 }
      );
    }

    // Upsert
    const existing = await db
      .select()
      .from(predictions)
      .where(
        and(
          eq(predictions.userId, session.userId),
          eq(predictions.matchId, matchId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(predictions)
        .set({ homeScore, awayScore, updatedAt: new Date() })
        .where(eq(predictions.id, existing[0].id));
    } else {
      await db.insert(predictions).values({
        userId: session.userId,
        matchId,
        homeScore,
        awayScore,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
