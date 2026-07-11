// GET /api/stats?groupSlug=...
// Estadísticas de gamificación de la porra (máximo acertante, racha de
// exactos, mejor jornada, mayor goleada acertada). Mismo esquema de auth y
// cache que /api/leaderboard: miembros ven todo, visitantes de porras
// públicas también (getPublicGroup), 30s de cache compartido.

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getSession } from "@/lib/session";
import { getGroupForMember, getPublicGroup } from "@/lib/group-access";
import { getGroupStats } from "@/lib/stats";

const getCachedStats = unstable_cache(
  async (groupId: number, tournamentId: number) => getGroupStats(groupId, tournamentId),
  ["group-stats"],
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

  const stats = await getCachedStats(ctx.groupId, ctx.tournamentId);
  return NextResponse.json({ ok: true, stats });
}
