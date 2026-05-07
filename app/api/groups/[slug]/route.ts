import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupMembers, tournaments, users } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

// GET detalle del grupo (solo si soy miembro)
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [row] = await db
    .select({
      id: groups.id,
      slug: groups.slug,
      name: groups.name,
      ownerId: groups.ownerId,
      tournamentId: groups.tournamentId,
      tournamentSlug: tournaments.slug,
      tournamentName: tournaments.name,
      inviteCode: groups.inviteCode,
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
      tournamentSlug: row.tournamentSlug,
      tournamentName: row.tournamentName,
      isOwner: row.ownerId === session.userId,
      inviteCode: row.ownerId === session.userId ? row.inviteCode : null,
      myRole: member.role,
    },
  });
}

// DELETE — solo owner puede borrar el grupo
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
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
