import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { predictions, matches } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getTournamentStart } from "@/lib/tournament";
import { getGroupForMember } from "@/lib/group-access";

// GET ?groupSlug=xxx — predicciones del usuario logado en ese grupo
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const groupSlug = req.nextUrl.searchParams.get("groupSlug");
  if (!groupSlug) {
    return NextResponse.json(
      { error: "Falta groupSlug" },
      { status: 400 }
    );
  }

  const ctx = await getGroupForMember(groupSlug, session.userId);
  if (!ctx) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.userId, session.userId),
        eq(predictions.groupId, ctx.groupId)
      )
    );

  return NextResponse.json({ predictions: rows });
}

// POST — guardar/actualizar una predicción en el grupo
// Solo se puede modificar si el torneo del grupo aún no ha empezado.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { groupSlug, matchId, homeScore, awayScore } = body;

    if (typeof groupSlug !== "string" || !groupSlug) {
      return NextResponse.json({ error: "Falta groupSlug" }, { status: 400 });
    }
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

    const ctx = await getGroupForMember(groupSlug, session.userId);
    if (!ctx) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Cierre por torneo: con el primer partido se bloquean todas las predicciones.
    const start = await getTournamentStart(ctx.tournamentId);
    if (start && new Date() >= new Date(start.iso)) {
      return NextResponse.json(
        { error: "El torneo ya ha comenzado, las predicciones están cerradas" },
        { status: 403 }
      );
    }

    // Validar que el partido pertenece al torneo del grupo
    const [m] = await db
      .select()
      .from(matches)
      .where(and(eq(matches.id, matchId), eq(matches.tournamentId, ctx.tournamentId)))
      .limit(1);

    if (!m) {
      return NextResponse.json(
        { error: "Partido no pertenece a este torneo" },
        { status: 404 }
      );
    }

    // Upsert
    const [existing] = await db
      .select()
      .from(predictions)
      .where(
        and(
          eq(predictions.userId, session.userId),
          eq(predictions.matchId, matchId),
          eq(predictions.groupId, ctx.groupId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(predictions)
        .set({ homeScore, awayScore, updatedAt: new Date() })
        .where(eq(predictions.id, existing.id));
    } else {
      await db.insert(predictions).values({
        userId: session.userId,
        matchId,
        groupId: ctx.groupId,
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
