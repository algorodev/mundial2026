// Cron de auto-resultados.
//
// Para cada torneo con apiLeagueId/apiSeason y status 'live' o 'upcoming':
//   1. Pide fixtures de la ventana [ayer-UTC, hoy-UTC] a API-Football
//   2. Por cada fixture FT/AET/PEN cuyo apiFixtureId coincida con uno nuestro,
//      escribe homeScore/awayScore y marca resultSource='api'.
//   3. NUNCA pisa rows con resultSource='admin' (override manual gana siempre).
//   4. Sólo escribe resultados FINALES, no parciales (evita que el scoring
//      oscile en directo; los live scores irán por endpoints separados).
//
// Auth: Vercel inyecta `Authorization: Bearer ${CRON_SECRET}` cuando se
// configura el env var. Sin CRON_SECRET, el endpoint rechaza todo (401).
//
// Schedule en vercel.json: */10 * * * * (cada 10 min).

import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments } from "@/lib/db/schema";
import type { Match } from "@/lib/db/schema";
import {
  getFixturesByDateRange,
  isFinalScore,
  type ApiFixture,
} from "@/lib/api-football";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TournamentSummary = {
  slug: string;
  fetched: number;
  updated: number;
  skippedAdmin: number;
  skippedNotFinal: number;
  error?: string;
};

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const all = await db.select().from(tournaments);
  const targets = all.filter(
    (t) =>
      t.apiLeagueId &&
      t.apiSeason &&
      (t.status === "live" || t.status === "upcoming")
  );

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const from = yesterday.toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);

  const summary: TournamentSummary[] = [];

  for (const t of targets) {
    const s: TournamentSummary = {
      slug: t.slug,
      fetched: 0,
      updated: 0,
      skippedAdmin: 0,
      skippedNotFinal: 0,
    };

    let fixtures: ApiFixture[];
    try {
      fixtures = await getFixturesByDateRange(
        t.apiLeagueId!,
        t.apiSeason!,
        from,
        to
      );
    } catch (e) {
      s.error = (e as Error).message;
      summary.push(s);
      continue;
    }
    s.fetched = fixtures.length;

    const tMatches = await db
      .select()
      .from(matches)
      .where(
        and(eq(matches.tournamentId, t.id), isNotNull(matches.apiFixtureId))
      );
    const byApiId = new Map<number, Match>();
    for (const m of tMatches) {
      if (m.apiFixtureId) byApiId.set(m.apiFixtureId, m);
    }

    for (const fx of fixtures) {
      const ours = byApiId.get(fx.fixture.id);
      if (!ours) continue;
      if (ours.resultSource === "admin") {
        s.skippedAdmin++;
        continue;
      }
      if (!isFinalScore(fx.fixture.status)) {
        s.skippedNotFinal++;
        continue;
      }
      const home = fx.score.fulltime.home;
      const away = fx.score.fulltime.away;
      if (home === null || away === null) continue;
      if (ours.homeScore === home && ours.awayScore === away) {
        // Ya está al día (probablemente cron anterior). No spameamos updates.
        continue;
      }
      await db
        .update(matches)
        .set({ homeScore: home, awayScore: away, resultSource: "api" })
        .where(eq(matches.id, ours.id));
      s.updated++;
    }

    summary.push(s);
  }

  return NextResponse.json({
    ok: true,
    window: { from, to },
    summary,
  });
}
