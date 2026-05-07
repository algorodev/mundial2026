import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupMembers, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

// GET — info del grupo asociado a un código de invitación (sin unir todavía)
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const [row] = await db
    .select({
      slug: groups.slug,
      name: groups.name,
      tournamentName: tournaments.name,
    })
    .from(groups)
    .innerJoin(tournaments, eq(groups.tournamentId, tournaments.id))
    .where(eq(groups.inviteCode, code))
    .limit(1);

  if (!row) {
    return NextResponse.json(
      { error: "Código no válido" },
      { status: 404 }
    );
  }
  return NextResponse.json({ group: row });
}

// POST — me uno al grupo (si estoy logado)
export async function POST(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const code = params.code.toUpperCase();

  const [g] = await db
    .select({ id: groups.id, slug: groups.slug })
    .from(groups)
    .where(eq(groups.inviteCode, code))
    .limit(1);

  if (!g) {
    return NextResponse.json(
      { error: "Código no válido" },
      { status: 404 }
    );
  }

  // Si ya soy miembro, no fallamos — devolvemos ok con redirect
  const [existing] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, g.id),
        eq(groupMembers.userId, session.userId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(groupMembers).values({
      groupId: g.id,
      userId: session.userId,
      role: "member",
    });
  }

  return NextResponse.json({ ok: true, slug: g.slug });
}
