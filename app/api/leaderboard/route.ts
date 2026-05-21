import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, matches, predictions, groupMembers } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { calcPoints } from "@/lib/scoring";
import { getGroupForMember, getPublicGroup } from "@/lib/group-access";

export async function GET(req: NextRequest) {
  const groupSlug = req.nextUrl.searchParams.get("groupSlug");
  if (!groupSlug) {
    return NextResponse.json({ error: "Falta groupSlug" }, { status: 400 });
  }

  const session = await getSession();

  // Resolución de contexto: primero miembro (con sesión), si falla y el grupo
  // es público, lo dejamos pasar como visitante (read-only).
  let ctx: { groupId: number; tournamentId: number } | null = null;
  if (session) {
    const memberCtx = await getGroupForMember(groupSlug, session.userId);
    if (memberCtx) {
      ctx = { groupId: memberCtx.groupId, tournamentId: memberCtx.tournamentId };
    }
  }
  if (!ctx) {
    const pub = await getPublicGroup(groupSlug);
    if (pub) {
      ctx = { groupId: pub.groupId, tournamentId: pub.tournamentId };
    }
  }
  if (!ctx) {
    return NextResponse.json(
      { error: session ? "No autorizado" : "No autenticado" },
      { status: session ? 403 : 401 }
    );
  }

  // Miembros del grupo + partidos del torneo + predicciones del grupo
  const memberRows = await db
    .select({
      userId: groupMembers.userId,
      name: users.name,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, ctx.groupId));

  const memberIds = memberRows.map((m) => m.userId);
  if (memberIds.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  const [allMatches, allPreds] = await Promise.all([
    db.select().from(matches).where(eq(matches.tournamentId, ctx.tournamentId)),
    db
      .select()
      .from(predictions)
      .where(eq(predictions.groupId, ctx.groupId)),
  ]);

  const matchById = new Map(allMatches.map((m) => [m.id, m]));

  const stats = new Map<
    number,
    {
      userId: number;
      name: string;
      total: number;
      exact: number;
      outcome: number;
      miss: number;
      played: number;
    }
  >();

  for (const m of memberRows) {
    stats.set(m.userId, {
      userId: m.userId,
      name: m.name,
      total: 0,
      exact: 0,
      outcome: 0,
      miss: 0,
      played: 0,
    });
  }

  for (const p of allPreds) {
    const s = stats.get(p.userId);
    if (!s) continue;
    const m = matchById.get(p.matchId);
    if (!m) continue;
    if (m.homeScore == null || m.awayScore == null) continue;

    const { points, result } = calcPoints(
      p.homeScore,
      p.awayScore,
      m.homeScore,
      m.awayScore
    );
    s.total += points;
    s.played += 1;
    if (result === "exact") s.exact += 1;
    else if (result === "outcome") s.outcome += 1;
    else if (result === "miss") s.miss += 1;
  }

  const leaderboard = Array.from(stats.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.exact !== a.exact) return b.exact - a.exact;
    return a.name.localeCompare(b.name);
  });

  let prevTotal: number | null = null;
  let prevExact: number | null = null;
  let prevPos = 0;
  const ranked = leaderboard.map((row, idx) => {
    const tied =
      prevTotal !== null &&
      row.total === prevTotal &&
      row.exact === prevExact;
    const pos = tied ? prevPos : idx + 1;
    prevTotal = row.total;
    prevExact = row.exact;
    prevPos = pos;
    return { ...row, position: pos };
  });

  return NextResponse.json({ leaderboard: ranked });
}
