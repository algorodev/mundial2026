import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

// DELETE — expulsar miembro o salir uno mismo
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string; userId: string } }
) {
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

  if (!g) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const isOwner = g.ownerId === session.userId;
  const isSelf = targetId === session.userId;

  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (targetId === g.ownerId) {
    return NextResponse.json(
      { error: "El owner no puede salir. Borra el grupo si quieres cerrarlo." },
      { status: 400 }
    );
  }

  await db
    .delete(groupMembers)
    .where(
      and(eq(groupMembers.groupId, g.id), eq(groupMembers.userId, targetId))
    );

  return NextResponse.json({ ok: true });
}
