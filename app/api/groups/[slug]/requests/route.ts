import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupJoinRequests, users } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

// GET — lista de solicitudes pendientes (solo owner)
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
  if (g.ownerId !== session.userId) {
    return NextResponse.json({ error: "Solo el owner" }, { status: 403 });
  }

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      requestedAt: groupJoinRequests.requestedAt,
    })
    .from(groupJoinRequests)
    .innerJoin(users, eq(groupJoinRequests.userId, users.id))
    .where(eq(groupJoinRequests.groupId, g.id))
    .orderBy(asc(groupJoinRequests.requestedAt));

  return NextResponse.json({
    requests: rows.map((r) => ({
      ...r,
      requestedAt: r.requestedAt.toISOString(),
    })),
  });
}
