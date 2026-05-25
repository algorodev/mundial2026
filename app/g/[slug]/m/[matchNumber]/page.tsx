import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments } from "@/lib/db/schema";
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

  const dateLabel = formatKickoff(match.kickoffAt);

  return (
    <div className="pt-8">
      <Link
        href={`/g/${slug}`}
        className="inline-block font-mono text-xs text-chalk-300 hover:text-flame-400 uppercase tracking-widest mb-3"
      >
        ← {ctx.name}
      </Link>

      <div className="cromo bg-paper-50 text-pitch-950 p-6 sm:p-8 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-widest text-pitch-700 mb-5">
          {match.groupName && (
            <span className={`group-${match.groupName} px-2 py-0.5 rounded-sm`}>
              GRUPO {match.groupName}
            </span>
          )}
          <span>{dateLabel}</span>
          {match.stadium && <span>· {match.stadium}</span>}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center">
          <div className="flex flex-col items-center min-w-0">
            <TeamBadge
              code={match.homeCode}
              flag={match.homeFlag}
              alt={match.homeTeam}
              size="lg"
            />
            <span className="font-display uppercase text-sm sm:text-base tracking-tight mt-2 text-center truncate max-w-full">
              {match.homeTeam}
            </span>
          </div>
          <div className="font-display text-4xl sm:text-6xl tabular-nums whitespace-nowrap">
            {match.homeScore !== null && match.awayScore !== null ? (
              <>
                {match.homeScore}
                <span className="text-brick-500 mx-2">·</span>
                {match.awayScore}
              </>
            ) : (
              <span className="text-pitch-400">vs</span>
            )}
          </div>
          <div className="flex flex-col items-center min-w-0">
            <TeamBadge
              code={match.awayCode}
              flag={match.awayFlag}
              alt={match.awayTeam}
              size="lg"
            />
            <span className="font-display uppercase text-sm sm:text-base tracking-tight mt-2 text-center truncate max-w-full">
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
