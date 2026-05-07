import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groups,
  groupMembers,
  groupJoinRequests,
  tournaments,
} from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getTournamentStart } from "@/lib/tournament";

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
      description: groups.description,
      tournamentName: tournaments.name,
      joinPolicy: groups.joinPolicy,
      joinDeadline: groups.joinDeadline,
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
  return NextResponse.json({
    group: {
      ...row,
      joinDeadline: row.joinDeadline?.toISOString() ?? null,
    },
  });
}

// POST — me uno al grupo (si estoy logado y el grupo lo permite)
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
    .select()
    .from(groups)
    .where(eq(groups.inviteCode, code))
    .limit(1);

  if (!g) {
    return NextResponse.json(
      { error: "Código no válido" },
      { status: 404 }
    );
  }

  // Si ya soy miembro, no fallamos — devolvemos ok con redirect al grupo
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

  if (existing) {
    return NextResponse.json({ ok: true, slug: g.slug, status: "joined" });
  }

  // Política closed: no se acepta a más miembros aunque tengan el link.
  if (g.joinPolicy === "closed") {
    return NextResponse.json(
      { error: "Este grupo ya no acepta nuevas inscripciones" },
      { status: 403 }
    );
  }

  // Fecha límite, si la hay
  if (g.joinDeadline && Date.now() > g.joinDeadline.getTime()) {
    return NextResponse.json(
      { error: "El plazo para unirse a este grupo ha terminado" },
      { status: 403 }
    );
  }

  // Si el torneo ya ha empezado, sólo se admite la entrada cuando el grupo
  // tiene allowLateJoin activado (default: rechazar entradas tardías para
  // mantener la integridad de la porra).
  if (g.allowLateJoin !== 1) {
    const start = await getTournamentStart(g.tournamentId);
    if (start && Date.now() >= new Date(start.iso).getTime()) {
      return NextResponse.json(
        {
          error:
            "El torneo ya ha empezado y este grupo no admite entradas tardías",
        },
        { status: 403 }
      );
    }
  }

  // Política approval: se crea una solicitud pendiente en lugar de unirse.
  if (g.joinPolicy === "approval") {
    const [pending] = await db
      .select()
      .from(groupJoinRequests)
      .where(
        and(
          eq(groupJoinRequests.groupId, g.id),
          eq(groupJoinRequests.userId, session.userId)
        )
      )
      .limit(1);

    if (!pending) {
      await db.insert(groupJoinRequests).values({
        groupId: g.id,
        userId: session.userId,
      });
    }
    return NextResponse.json({ ok: true, slug: g.slug, status: "pending" });
  }

  // Política open (default): unión directa
  await db.insert(groupMembers).values({
    groupId: g.id,
    userId: session.userId,
    role: "member",
  });
  return NextResponse.json({ ok: true, slug: g.slug, status: "joined" });
}
