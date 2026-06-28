import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { users, matches, predictions, groupMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { calcPoints, calcExtendedPoints } from "@/lib/scoring";
import { getGroupForMember, getPublicGroup } from "@/lib/group-access";
import { tournaments } from "@/lib/db/schema";

// Datos pesados del leaderboard: idénticos para todos los miembros del grupo.
// Cacheamos 30s; con partidos en directo el leaderboard no cambia hasta que
// el cron escribe el resultado final, así que 30s de lag es completamente aceptable.
const getLeaderboardData = unstable_cache(
  async (groupId: number, tournamentId: number) => {
    const memberRows = await db
      .select({ userId: groupMembers.userId, name: users.name })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));

    if (memberRows.length === 0) {
      return { memberRows: [], allMatches: [], allPreds: [], knockoutScoring: null as string | null };
    }

    const [allMatches, allPreds, [tournament]] = await Promise.all([
      db
        .select({
          id: matches.id,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
          homeFrom: matches.homeFrom,
          homeScoreAet: matches.homeScoreAet,
          awayScoreAet: matches.awayScoreAet,
          penaltyHome: matches.penaltyHome,
          penaltyAway: matches.penaltyAway,
        })
        .from(matches)
        .where(eq(matches.tournamentId, tournamentId)),
      db
        .select({
          userId: predictions.userId,
          matchId: predictions.matchId,
          homeScore: predictions.homeScore,
          awayScore: predictions.awayScore,
          homeScoreAet: predictions.homeScoreAet,
          awayScoreAet: predictions.awayScoreAet,
          penaltyHome: predictions.penaltyHome,
          penaltyAway: predictions.penaltyAway,
        })
        .from(predictions)
        .where(eq(predictions.groupId, groupId)),
      db
        .select({ knockoutScoring: tournaments.knockoutScoring })
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .limit(1),
    ]);

    return {
      memberRows,
      allMatches,
      allPreds,
      knockoutScoring: tournament?.knockoutScoring ?? null,
    };
  },
  ["leaderboard-data"],
  { revalidate: 30 }
);

export async function GET(req: NextRequest) {
  const groupSlug = req.nextUrl.searchParams.get("groupSlug");
  if (!groupSlug) {
    return NextResponse.json({ error: "Falta groupSlug" }, { status: 400 });
  }

  const session = await getSession();

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

  const { memberRows, allMatches, allPreds, knockoutScoring } =
    await getLeaderboardData(ctx.groupId, ctx.tournamentId);

  if (memberRows.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  const isExtended = knockoutScoring === "extended";
  const matchById = new Map(allMatches.map((m) => [m.id, m]));

  const stats = new Map<
    number,
    {
      userId: number;
      name: string | null;
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
    let totalPts = points;
    if (isExtended && m.homeFrom != null) {
      const { aetPoints, penPoints } = calcExtendedPoints(
        { homeScoreAet: p.homeScoreAet, awayScoreAet: p.awayScoreAet, penaltyHome: p.penaltyHome, penaltyAway: p.penaltyAway },
        { homeScoreAet: m.homeScoreAet, awayScoreAet: m.awayScoreAet, penaltyHome: m.penaltyHome, penaltyAway: m.penaltyAway }
      );
      totalPts += aetPoints + penPoints;
    }
    s.total += totalPts;
    s.played += 1;
    if (result === "exact") s.exact += 1;
    else if (result === "outcome") s.outcome += 1;
    else if (result === "miss") s.miss += 1;
  }

  const leaderboard = Array.from(stats.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.exact !== a.exact) return b.exact - a.exact;
    return (a.name ?? "").localeCompare(b.name ?? "");
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
