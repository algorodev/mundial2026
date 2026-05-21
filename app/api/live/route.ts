import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember, getPublicGroup } from "@/lib/group-access";

export const dynamic = "force-dynamic";

// Mismos cálculos de antes — la única diferencia es que filtramos por
// el torneo asociado al grupo del que el user es miembro.
const REAL_SPAN_MS = 17 * 24 * 3600_000;
const REAL_MATCH_MS = 90 * 60_000;
const REAL_LIVE_WINDOW_MS = 2.5 * 3600_000;
const SIM_THRESHOLD_MS = 2 * 24 * 3600_000;

export async function GET(req: NextRequest) {
  const groupSlug = req.nextUrl.searchParams.get("groupSlug");
  if (!groupSlug) {
    return NextResponse.json({ error: "Falta groupSlug" }, { status: 400 });
  }

  const session = await getSession();
  let ctx: { tournamentId: number } | null = null;
  if (session) {
    const memberCtx = await getGroupForMember(groupSlug, session.userId);
    if (memberCtx) ctx = { tournamentId: memberCtx.tournamentId };
  }
  if (!ctx) {
    const pub = await getPublicGroup(groupSlug);
    if (pub) ctx = { tournamentId: pub.tournamentId };
  }
  if (!ctx) {
    return NextResponse.json(
      { error: session ? "No autorizado" : "No autenticado" },
      { status: session ? 403 : 401 }
    );
  }

  const all = await db
    .select()
    .from(matches)
    .where(eq(matches.tournamentId, ctx.tournamentId))
    .orderBy(asc(matches.kickoffAt));

  const now = Date.now();

  if (all.length === 0) {
    return NextResponse.json({ live: [], next: null, serverNow: now });
  }

  const minK = all[0].kickoffAt.getTime();
  const maxK = all[all.length - 1].kickoffAt.getTime();
  const span = maxK - minK;
  const isSim = span > 0 && span < SIM_THRESHOLD_MS;
  const liveWindowMs = isSim
    ? Math.max((span * REAL_MATCH_MS) / REAL_SPAN_MS, 60_000)
    : REAL_LIVE_WINDOW_MS;

  const live = all
    .filter((m) => {
      if (m.homeScore == null || m.awayScore == null) return false;
      const t = m.kickoffAt.getTime();
      return t <= now && now < t + liveWindowMs;
    })
    .map((m) => {
      const t = m.kickoffAt.getTime();
      const elapsed = now - t;
      const minute = Math.max(
        1,
        Math.min(90, Math.round((elapsed / liveWindowMs) * 90))
      );
      return {
        id: m.id,
        matchNumber: m.matchNumber,
        groupName: m.groupName,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeCode: m.homeCode,
        awayCode: m.awayCode,
        homeFlag: m.homeFlag,
        awayFlag: m.awayFlag,
        homeScore: m.homeScore!,
        awayScore: m.awayScore!,
        kickoffAt: m.kickoffAt.toISOString(),
        minute,
      };
    });

  const nextRow = all.find((m) => m.kickoffAt.getTime() > now);
  const next = nextRow
    ? {
        id: nextRow.id,
        matchNumber: nextRow.matchNumber,
        groupName: nextRow.groupName,
        homeTeam: nextRow.homeTeam,
        awayTeam: nextRow.awayTeam,
        homeCode: nextRow.homeCode,
        awayCode: nextRow.awayCode,
        homeFlag: nextRow.homeFlag,
        awayFlag: nextRow.awayFlag,
        kickoffAt: nextRow.kickoffAt.toISOString(),
      }
    : null;

  return NextResponse.json({ live, next, serverNow: now });
}
