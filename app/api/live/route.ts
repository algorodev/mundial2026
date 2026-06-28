import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { matches, teams } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember, getPublicGroup } from "@/lib/group-access";
import { getFixturesByIds, isLive } from "@/lib/api-football";

export const dynamic = "force-dynamic";

const REAL_SPAN_MS = 17 * 24 * 3600_000;
const REAL_MATCH_MS = 90 * 60_000;
const REAL_LIVE_WINDOW_MS = 2.5 * 3600_000;
const SIM_THRESHOLD_MS = 2 * 24 * 3600_000;

// Datos de partidos y equipos del torneo: idénticos para todos los usuarios.
// Cacheamos 15s para evitar que cada poll de cada usuario genere una query.
const getTournamentLiveData = unstable_cache(
  async (tournamentId: number) => {
    const [matchRows, teamsRows] = await Promise.all([
      db
        .select({
          id: matches.id,
          matchNumber: matches.matchNumber,
          groupName: matches.groupName,
          homeTeam: matches.homeTeam,
          awayTeam: matches.awayTeam,
          homeCode: matches.homeCode,
          awayCode: matches.awayCode,
          homeFlag: matches.homeFlag,
          awayFlag: matches.awayFlag,
          kickoffAt: matches.kickoffAt,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
          apiFixtureId: matches.apiFixtureId,
        })
        .from(matches)
        .where(eq(matches.tournamentId, tournamentId))
        .orderBy(asc(matches.kickoffAt)),
      db
        .select({ code: teams.code, logoUrl: teams.logoUrl })
        .from(teams)
        .where(eq(teams.tournamentId, tournamentId)),
    ]);
    // kickoffAt es Date en Drizzle; unstable_cache serializa a JSON (string).
    // Lo guardamos como ISO para restaurarlo correctamente al leer la caché.
    return {
      matchRows: matchRows.map((m) => ({
        ...m,
        kickoffAt: m.kickoffAt.toISOString(),
      })),
      teamsRows,
    };
  },
  ["live-tournament"],
  { revalidate: 15 }
);

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

  const { matchRows, teamsRows } = await getTournamentLiveData(ctx.tournamentId);
  // Restaurar Date desde ISO string (unstable_cache serializa a JSON)
  const all = matchRows.map((m) => ({ ...m, kickoffAt: new Date(m.kickoffAt) }));

  const now = Date.now();

  if (all.length === 0) {
    return NextResponse.json({ live: [], next: null, serverNow: now });
  }

  const logoByCode = new Map<string, string | null>(
    teamsRows.map((t) => [t.code, t.logoUrl])
  );
  const logoFor = (code: string | null) =>
    code ? logoByCode.get(code) ?? null : null;

  const minK = all[0].kickoffAt.getTime();
  const maxK = all[all.length - 1].kickoffAt.getTime();
  const span = maxK - minK;
  const isSim = span > 0 && span < SIM_THRESHOLD_MS;
  const liveWindowMs = isSim
    ? Math.max((span * REAL_MATCH_MS) / REAL_SPAN_MS, 60_000)
    : REAL_LIVE_WINDOW_MS;

  const live = all
    .filter((m) => {
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
        homeLogoUrl: logoFor(m.homeCode),
        awayLogoUrl: logoFor(m.awayCode),
        homeScore: m.homeScore ?? 0,
        awayScore: m.awayScore ?? 0,
        kickoffAt: m.kickoffAt.toISOString(),
        minute,
        statusShort: null as string | null,
        apiFixtureId: m.apiFixtureId,
      };
    });

  const mappedIds = live
    .map((m) => m.apiFixtureId)
    .filter((x): x is number => x !== null);
  if (mappedIds.length > 0) {
    try {
      const fixtures = await getFixturesByIds(mappedIds, { revalidate: 30 });
      for (const fx of fixtures) {
        const target = live.find((m) => m.apiFixtureId === fx.fixture.id);
        if (!target) continue;
        if (isLive(fx.fixture.status) && fx.fixture.status.elapsed !== null) {
          target.minute = fx.fixture.status.elapsed;
          target.statusShort = fx.fixture.status.short;
        }
      }
    } catch {
      // ignoramos: nos quedamos con la heurística
    }
  }

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
        homeLogoUrl: logoFor(nextRow.homeCode),
        awayLogoUrl: logoFor(nextRow.awayCode),
        kickoffAt: nextRow.kickoffAt.toISOString(),
      }
    : null;

  return NextResponse.json({ live, next, serverNow: now });
}
