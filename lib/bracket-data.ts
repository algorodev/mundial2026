// Construye el cuadro de eliminatorias (BracketRound[]) desde nuestra propia
// tabla `matches` — no depende de API-Football, así que funciona aunque el
// torneo no tenga apiLeagueId/apiSeason. Extraído de
// app/g/[slug]/standings/page.tsx para poder reutilizarlo en su propia
// pestaña (app/g/[slug]/bracket/page.tsx).

import { and, eq, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams } from "@/lib/db/schema";
import { ROUND_PHASE_LABELS } from "@/lib/knockout-phases";
import type { BracketRound } from "@/components/KnockoutBracket";
import type { Dictionary } from "@/lib/i18n";

export async function getBracketRounds(
  tournamentId: number,
  t: Dictionary
): Promise<BracketRound[]> {
  const knockoutMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        inArray(matches.groupName, [...ROUND_PHASE_LABELS])
      )
    )
    .orderBy(asc(matches.matchNumber));

  const knockoutCodes = [
    ...new Set(
      knockoutMatches.flatMap((m) => [m.homeCode, m.awayCode]).filter((c): c is string => !!c)
    ),
  ];
  const knockoutTeamLogos: Record<string, string> = {};
  if (knockoutCodes.length > 0) {
    const rows = await db
      .select({ code: teams.code, logoUrl: teams.logoUrl })
      .from(teams)
      .where(and(eq(teams.tournamentId, tournamentId), inArray(teams.code, knockoutCodes)));
    for (const r of rows) {
      if (r.logoUrl) knockoutTeamLogos[r.code] = r.logoUrl;
    }
  }

  return ROUND_PHASE_LABELS.map((key) => ({
    key,
    label: t.bracket[key],
    matches: knockoutMatches
      .filter((m) => m.groupName === key)
      .map((m) => ({
        matchNumber: m.matchNumber,
        date: m.matchDate ?? "",
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeCode: m.homeCode,
        awayCode: m.awayCode,
        homeFlag: m.homeFlag,
        awayFlag: m.awayFlag,
        homeLogoUrl: m.homeCode ? knockoutTeamLogos[m.homeCode] ?? null : null,
        awayLogoUrl: m.awayCode ? knockoutTeamLogos[m.awayCode] ?? null : null,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
      })),
  })).filter((round) => round.matches.length > 0);
}
