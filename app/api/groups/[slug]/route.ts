import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupMembers, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { parseSettings } from "@/lib/group-settings";

// GET detalle del grupo (solo si soy miembro)
export async function GET(_req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [row] = await db
    .select({
      id: groups.id,
      slug: groups.slug,
      name: groups.name,
      description: groups.description,
      ownerId: groups.ownerId,
      tournamentId: groups.tournamentId,
      tournamentSlug: tournaments.slug,
      tournamentName: tournaments.name,
      inviteCode: groups.inviteCode,
      predictionLockMode: groups.predictionLockMode,
      lockMinutesBefore: groups.lockMinutesBefore,
      joinPolicy: groups.joinPolicy,
      joinDeadline: groups.joinDeadline,
      allowLateJoin: groups.allowLateJoin,
      predictionsVisibility: groups.predictionsVisibility,
    })
    .from(groups)
    .innerJoin(tournaments, eq(groups.tournamentId, tournaments.id))
    .where(eq(groups.slug, params.slug))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const [member] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, row.id),
        eq(groupMembers.userId, session.userId)
      )
    )
    .limit(1);

  if (!member) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Solo el owner ve el inviteCode (otros pueden re-pedirlo si quieren)
  return NextResponse.json({
    group: {
      slug: row.slug,
      name: row.name,
      description: row.description,
      tournamentSlug: row.tournamentSlug,
      tournamentName: row.tournamentName,
      isOwner: row.ownerId === session.userId,
      inviteCode: row.ownerId === session.userId ? row.inviteCode : null,
      myRole: member.role,
      predictionLockMode: row.predictionLockMode,
      lockMinutesBefore: row.lockMinutesBefore,
      joinPolicy: row.joinPolicy,
      joinDeadline: row.joinDeadline?.toISOString() ?? null,
      allowLateJoin: row.allowLateJoin === 1,
      predictionsVisibility: row.predictionsVisibility,
    },
  });
}

// PATCH — owner edita la configuración del grupo
export async function PATCH(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(groups)
    .where(eq(groups.slug, params.slug))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (row.ownerId !== session.userId) {
    return NextResponse.json({ error: "Solo el owner" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // El nombre puede cambiarse (3-80 chars). Es independiente de los settings.
    let nextName = row.name;
    if (body?.name !== undefined) {
      const n = String(body.name ?? "").trim();
      if (n.length < 3 || n.length > 80) {
        return NextResponse.json(
          { error: "El nombre debe tener entre 3 y 80 caracteres" },
          { status: 400 }
        );
      }
      nextName = n;
    }

    const parsed = parseSettings(body, {
      description: row.description,
      predictionLockMode: row.predictionLockMode as
        | "per-match"
        | "tournament-start",
      lockMinutesBefore: row.lockMinutesBefore,
      joinPolicy: row.joinPolicy as "open" | "approval" | "closed",
      joinDeadline: row.joinDeadline,
      allowLateJoin: row.allowLateJoin === 1,
      predictionsVisibility: row.predictionsVisibility as
        | "hidden-until-lock"
        | "open",
    });
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const s = parsed.settings;

    await db
      .update(groups)
      .set({
        name: nextName,
        description: s.description,
        predictionLockMode: s.predictionLockMode,
        lockMinutesBefore: s.lockMinutesBefore,
        joinPolicy: s.joinPolicy,
        joinDeadline: s.joinDeadline,
        allowLateJoin: s.allowLateJoin ? 1 : 0,
        predictionsVisibility: s.predictionsVisibility,
      })
      .where(eq(groups.id, row.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH group error:", e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE — solo owner puede borrar el grupo
export async function DELETE(_req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [row] = await db
    .select({ id: groups.id, ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.slug, params.slug))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (row.ownerId !== session.userId) {
    return NextResponse.json({ error: "Solo el owner" }, { status: 403 });
  }

  await db.delete(groups).where(eq(groups.id, row.id));
  return NextResponse.json({ ok: true });
}
