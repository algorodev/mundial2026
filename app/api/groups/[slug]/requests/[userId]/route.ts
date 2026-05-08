import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groups,
  groupJoinRequests,
  groupMembers,
} from "@/lib/db/schema";
import { getSession } from "@/lib/session";

// POST → aprobar solicitud (mueve a groupMembers, borra la request)
export async function POST(
  _req: NextRequest,
  props: { params: Promise<{ slug: string; userId: string }> }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const targetId = Number(params.userId);
  if (!Number.isInteger(targetId)) {
    return NextResponse.json({ error: "userId inválido" }, { status: 400 });
  }

  const [g] = await db
    .select({ id: groups.id, ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.slug, params.slug))
    .limit(1);
  if (!g) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (g.ownerId !== session.userId) {
    return NextResponse.json({ error: "Solo el owner" }, { status: 403 });
  }

  const [req] = await db
    .select()
    .from(groupJoinRequests)
    .where(
      and(
        eq(groupJoinRequests.groupId, g.id),
        eq(groupJoinRequests.userId, targetId)
      )
    )
    .limit(1);
  if (!req) {
    return NextResponse.json(
      { error: "Solicitud no encontrada" },
      { status: 404 }
    );
  }

  // Si por race ya está como miembro, sólo borramos la request (idempotente).
  const [existingMember] = await db
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, g.id), eq(groupMembers.userId, targetId))
    )
    .limit(1);

  if (!existingMember) {
    await db.insert(groupMembers).values({
      groupId: g.id,
      userId: targetId,
      role: "member",
    });
  }

  await db
    .delete(groupJoinRequests)
    .where(eq(groupJoinRequests.id, req.id));

  return NextResponse.json({ ok: true });
}

// DELETE → rechazar solicitud
export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ slug: string; userId: string }> }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const targetId = Number(params.userId);
  if (!Number.isInteger(targetId)) {
    return NextResponse.json({ error: "userId inválido" }, { status: 400 });
  }

  const [g] = await db
    .select({ id: groups.id, ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.slug, params.slug))
    .limit(1);
  if (!g) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (g.ownerId !== session.userId) {
    return NextResponse.json({ error: "Solo el owner" }, { status: 403 });
  }

  await db
    .delete(groupJoinRequests)
    .where(
      and(
        eq(groupJoinRequests.groupId, g.id),
        eq(groupJoinRequests.userId, targetId)
      )
    );

  return NextResponse.json({ ok: true });
}
