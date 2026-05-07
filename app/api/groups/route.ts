import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groups,
  groupMembers,
  tournaments,
} from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { randomInviteCode, slugify, uniqueSlugCandidate } from "@/lib/slug";

// GET — mis grupos
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: groups.id,
      slug: groups.slug,
      name: groups.name,
      ownerId: groups.ownerId,
      tournamentId: groups.tournamentId,
      tournamentName: tournaments.name,
      tournamentSlug: tournaments.slug,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .innerJoin(tournaments, eq(groups.tournamentId, tournaments.id))
    .where(eq(groupMembers.userId, session.userId))
    .orderBy(asc(groupMembers.joinedAt));

  return NextResponse.json({
    groups: rows.map((r) => ({
      ...r,
      joinedAt: r.joinedAt.toISOString(),
    })),
  });
}

// POST — crear grupo
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name: string = (body?.name ?? "").toString().trim();
    const tournamentSlug: string = (body?.tournamentSlug ?? "").toString().trim();

    if (name.length < 3 || name.length > 80) {
      return NextResponse.json(
        { error: "El nombre debe tener entre 3 y 80 caracteres" },
        { status: 400 }
      );
    }
    if (!tournamentSlug) {
      return NextResponse.json(
        { error: "Falta el torneo" },
        { status: 400 }
      );
    }

    const [tournament] = await db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.slug, tournamentSlug))
      .limit(1);

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneo no encontrado" },
        { status: 404 }
      );
    }

    // Genera slug único — reintenta hasta 5 veces.
    const baseSlug = slugify(name);
    let slug = "";
    for (let i = 0; i < 5; i++) {
      const candidate = uniqueSlugCandidate(baseSlug);
      const [exists] = await db
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.slug, candidate))
        .limit(1);
      if (!exists) {
        slug = candidate;
        break;
      }
    }
    if (!slug) {
      return NextResponse.json(
        { error: "No se pudo generar slug, prueba otro nombre" },
        { status: 500 }
      );
    }

    let inviteCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = randomInviteCode(6);
      const [exists] = await db
        .select({ id: groups.id })
        .from(groups)
        .where(eq(groups.inviteCode, candidate))
        .limit(1);
      if (!exists) {
        inviteCode = candidate;
        break;
      }
    }

    const [created] = await db
      .insert(groups)
      .values({
        slug,
        name,
        tournamentId: tournament.id,
        ownerId: session.userId,
        inviteCode,
      })
      .returning();

    await db.insert(groupMembers).values({
      groupId: created.id,
      userId: session.userId,
      role: "owner",
    });

    return NextResponse.json({ ok: true, group: { slug: created.slug } });
  } catch (e: any) {
    console.error("create group error:", e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
