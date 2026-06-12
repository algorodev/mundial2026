import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember } from "@/lib/group-access";
import TeamBadge from "@/components/TeamBadge";
import MatchDetailClient from "@/components/MatchDetailClient";

export default async function MatchDetailPage(props: {
  params: Promise<{ slug: string; matchNumber: string }>;
}) {
  const { slug, matchNumber: matchNumberStr } = await props.params;
  const matchNumber = Number(matchNumberStr);
  if (!Number.isInteger(matchNumber) || matchNumber <= 0) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/g/${slug}/m/${matchNumber}`)}`);
  }

  const ctx = await getGroupForMember(slug, session.userId);
  if (!ctx) notFound();

  const [match] = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, ctx.tournamentId),
        eq(matches.matchNumber, matchNumber)
      )
    )
    .limit(1);
  if (!match) notFound();

  const [tournament] = await db
    .select({ name: tournaments.name })
    .from(tournaments)
    .where(eq(tournaments.id, ctx.tournamentId))
    .limit(1);

  // Logos oficiales de los dos equipos del match (si están mapeados).
  const codes = [match.homeCode, match.awayCode].filter(
    (c): c is string => !!c
  );
  const teamRows =
    codes.length > 0
      ? await db
          .select({ code: teams.code, logoUrl: teams.logoUrl })
          .from(teams)
          .where(
            and(
              eq(teams.tournamentId, ctx.tournamentId),
              inArray(teams.code, codes)
            )
          )
      : [];
  const homeLogoUrl =
    teamRows.find((t) => t.code === match.homeCode)?.logoUrl ?? null;
  const awayLogoUrl =
    teamRows.find((t) => t.code === match.awayCode)?.logoUrl ?? null;

  const dateLabel = formatKickoff(match.kickoffAt);

  return (
    <div className="pt-8">
      <Link
        href={`/g/${slug}`}
        className="back-link mb-3"
      >
        ← {ctx.name}
      </Link>

      <div className="cromo bg-paper-50 text-pitch-950 p-5 sm:p-8 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-widest text-pitch-700 mb-5">
          {match.groupName && (
            <span className={`group-${match.groupName} px-2 py-0.5 rounded-sm`}>
              GRUPO {match.groupName}
            </span>
          )}
          <span>{dateLabel}</span>
          {match.stadium && (
            <span className="text-pitch-700/80">· {match.stadium}</span>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 sm:gap-6 items-center">
          <div className="flex flex-col items-center min-w-0 w-full">
            <TeamBadge
              code={match.homeCode}
              flag={match.homeFlag}
              logoUrl={homeLogoUrl}
              alt={match.homeTeam}
              size="lg"
            />
            <span className="font-display uppercase text-sm sm:text-base tracking-tight leading-tight text-balance mt-2 text-center w-full min-h-[2.5em] flex items-start justify-center">
              {match.homeTeam}
            </span>
          </div>
          <div className="font-display text-3xl sm:text-6xl tabular-nums whitespace-nowrap shrink-0 self-start mt-3 sm:mt-4">
            {match.homeScore !== null && match.awayScore !== null ? (
              <>
                {match.homeScore}
                <span className="text-brick-500 mx-1.5 sm:mx-2">·</span>
                {match.awayScore}
              </>
            ) : (
              <span className="text-pitch-400">vs</span>
            )}
          </div>
          <div className="flex flex-col items-center min-w-0 w-full">
            <TeamBadge
              code={match.awayCode}
              flag={match.awayFlag}
              logoUrl={awayLogoUrl}
              alt={match.awayTeam}
              size="lg"
            />
            <span className="font-display uppercase text-sm sm:text-base tracking-tight leading-tight text-balance mt-2 text-center w-full min-h-[2.5em] flex items-start justify-center">
              {match.awayTeam}
            </span>
          </div>
        </div>

        {tournament && (
          <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-widest text-pitch-500">
            {tournament.name}
          </p>
        )}
      </div>

      <MatchDetailClient
        matchId={match.id}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeCode={match.homeCode}
        awayCode={match.awayCode}
        homeFlag={match.homeFlag}
        awayFlag={match.awayFlag}
        homeLogoUrl={homeLogoUrl}
        awayLogoUrl={awayLogoUrl}
        hasApiFixture={match.apiFixtureId !== null}
        kickoffAtIso={match.kickoffAt.toISOString()}
      />
    </div>
  );
}

function formatKickoff(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  })
    .format(d)
    .replace(",", " ·");
}
