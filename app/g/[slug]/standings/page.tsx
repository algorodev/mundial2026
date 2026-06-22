import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq, inArray, isNotNull, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember } from "@/lib/group-access";
import GroupTabs from "@/components/GroupTabs";
import BackLink from "@/components/BackLink";
import TournamentBadge from "@/components/TournamentBadge";
import TournamentStandings from "@/components/TournamentStandings";
import KnockoutBracket, { type BracketRound } from "@/components/KnockoutBracket";
import { ROUND_PHASE_LABELS } from "@/lib/knockout-phases";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

export default async function GroupStandingsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/g/${params.slug}/standings`)}`);
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  const ctx = await getGroupForMember(params.slug, session.userId);
  if (!ctx) notFound();

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, ctx.tournamentId))
    .limit(1);
  if (!tournament) notFound();

  const mappedTeams =
    tournament.apiLeagueId && tournament.apiSeason
      ? await db
          .select({ code: teams.code, apiTeamId: teams.apiTeamId })
          .from(teams)
          .where(
            and(eq(teams.tournamentId, ctx.tournamentId), isNotNull(teams.apiTeamId))
          )
      : [];
  const teamCodeByApiId: Record<number, string> = {};
  for (const tm of mappedTeams) {
    if (tm.apiTeamId) teamCodeByApiId[tm.apiTeamId] = tm.code;
  }

  // Cuadro de eliminatoria: viene de nuestra propia tabla matches (no de la
  // API externa), así que se ve aunque el torneo no tenga apiLeagueId.
  const knockoutMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, ctx.tournamentId),
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
      .where(and(eq(teams.tournamentId, ctx.tournamentId), inArray(teams.code, knockoutCodes)));
    for (const r of rows) {
      if (r.logoUrl) knockoutTeamLogos[r.code] = r.logoUrl;
    }
  }

  const bracketRounds: BracketRound[] = ROUND_PHASE_LABELS.map((key) => ({
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

  return (
    <div className="pt-8">
      <BackLink href="/groups" className="mb-3">
        {t.leaderboard.backToMyPools}
      </BackLink>
      <div className="mb-6 flex items-start gap-4">
        <TournamentBadge
          slug={tournament.slug}
          name={tournament.name}
          size="xl"
          onDark
          className="shrink-0 mt-1"
        />
        <div className="min-w-0">
          <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none">
            {ctx.name}
          </h1>
          <p className="mt-3 inline-block bg-paper-50 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
            {tournament.name}
          </p>
        </div>
      </div>
      <GroupTabs
        slug={ctx.slug}
        active="standings"
        isOwner={ctx.myRole === "owner"}
      />

      <KnockoutBracket
        groupSlug={ctx.slug}
        rounds={bracketRounds}
        title={t.bracket.title}
      />

      {!tournament.apiLeagueId || !tournament.apiSeason ? (
        <div className="cromo bg-paper-50 text-pitch-950 p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-500">
            {t.standings.noSync}
          </p>
        </div>
      ) : (
        <TournamentStandings
          tournamentSlug={tournament.slug}
          groupSlug={ctx.slug}
          teamCodeByApiId={teamCodeByApiId}
        />
      )}
    </div>
  );
}
