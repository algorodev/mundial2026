import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupMembers, users } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

// GET — lista de miembros (debe ser miembro)
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [g] = await db
    .select({ id: groups.id, ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.slug, params.slug))
    .limit(1);

  if (!g) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const [me] = await db
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, g.id), eq(groupMembers.userId, session.userId))
    )
    .limit(1);
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, g.id))
    .orderBy(asc(groupMembers.joinedAt));

  return NextResponse.json({
    members: rows.map((r) => ({
      ...r,
      // No exponemos email a no-owners
      email: g.ownerId === session.userId ? r.email : null,
      joinedAt: r.joinedAt.toISOString(),
    })),
  });
}
