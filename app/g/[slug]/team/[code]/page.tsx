import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq, or, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember } from "@/lib/group-access";
import { getTeamById, type ApiTeamSummary } from "@/lib/api-football";
import TeamBadge from "@/components/TeamBadge";
import BackLink from "@/components/BackLink";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

const TEAM_INFO_TTL = 7 * 24 * 60 * 60; // 7 días: ficha de equipo apenas cambia

export default async function TeamDetailPage(props: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code: rawCode } = await props.params;
  const code = rawCode.toUpperCase();

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/g/${slug}/team/${rawCode}`)}`);
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  const ctx = await getGroupForMember(slug, session.userId);
  if (!ctx) notFound();

  const [team, tournament, allTeams, teamMatches] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(and(eq(teams.tournamentId, ctx.tournamentId), eq(teams.code, code)))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, ctx.tournamentId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(teams)
      .where(eq(teams.tournamentId, ctx.tournamentId)),
    db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.tournamentId, ctx.tournamentId),
          or(eq(matches.homeCode, code), eq(matches.awayCode, code))
        )
      )
      .orderBy(asc(matches.matchNumber)),
  ]);
  if (!team) notFound();

  const teamByCode: Record<
    string,
    { name: string; flagEmoji: string | null; logoUrl: string | null }
  > = {};
  for (const tm of allTeams) {
    teamByCode[tm.code] = { name: tm.name, flagEmoji: tm.flagEmoji, logoUrl: tm.logoUrl };
  }

  const record = teamMatches.reduce(
    (acc, m) => {
      if (m.homeScore === null || m.awayScore === null) return acc;
      const isHome = m.homeCode === code;
      const own = isHome ? m.homeScore : m.awayScore;
      const opp = isHome ? m.awayScore : m.homeScore;
      acc.played++;
      acc.goalsFor += own;
      acc.goalsAgainst += opp;
      if (own > opp) acc.win++;
      else if (own === opp) acc.draw++;
      else acc.lose++;
      return acc;
    },
    { played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0 }
  );

  let apiInfo: ApiTeamSummary | null = null;
  if (team.apiTeamId && tournament?.apiLeagueId && tournament?.apiSeason) {
    try {
      const [info] = await getTeamById(team.apiTeamId, { revalidate: TEAM_INFO_TTL });
      apiInfo = info ?? null;
    } catch {
      // Silenciamos: la página sigue funcionando solo con datos propios.
    }
  }

  return (
    <div className="pt-8">
      <BackLink href={`/g/${slug}`} className="mb-3">
        {ctx.name}
      </BackLink>

      <div className="cromo bg-paper-50 text-pitch-950 p-6 sm:p-8 mb-6 text-center">
        <div className="flex justify-center mb-3">
          <TeamBadge
            code={team.code}
            flag={team.flagEmoji}
            logoUrl={team.logoUrl}
            alt={team.name}
            size="lg"
          />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight">
          {team.name}
        </h1>
        {tournament && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-pitch-500">
            {tournament.name}
          </p>
        )}
        {apiInfo ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-mono uppercase tracking-widest text-pitch-700 border-t-2 border-dashed border-pitch-950/20 pt-4">
            {apiInfo.team.country && (
              <span>
                {t.teamDetail.country}: {apiInfo.team.country}
              </span>
            )}
            {apiInfo.team.founded && (
              <span>{t.teamDetail.founded.replace("{year}", String(apiInfo.team.founded))}</span>
            )}
            {apiInfo.venue.name && (
              <span>
                {t.teamDetail.venue}: {apiInfo.venue.name}
                {apiInfo.venue.city ? ` (${apiInfo.venue.city})` : ""}
              </span>
            )}
            {apiInfo.venue.capacity && (
              <span>{t.teamDetail.capacity.replace("{capacity}", apiInfo.venue.capacity.toLocaleString(locale))}</span>
            )}
          </div>
        ) : (
          <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-pitch-400 border-t-2 border-dashed border-pitch-950/20 pt-4">
            {t.teamDetail.noApiData}
          </p>
        )}
      </div>

      <h2 className="mb-4 flex items-center gap-3">
        <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
        <span className="bg-flame-500 text-pitch-950 font-display text-lg px-4 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
          {t.teamDetail.record}
        </span>
        <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
      </h2>
      <div className="cromo bg-paper-50 text-pitch-950 p-5 mb-8 grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
        <RecordStat label={t.standings.played} value={record.played} />
        <RecordStat label={t.standings.wins} value={record.win} />
        <RecordStat label={t.standings.draws} value={record.draw} />
        <RecordStat label={t.standings.losses} value={record.lose} />
        <RecordStat label={t.standings.goalsFor} value={record.goalsFor} />
        <RecordStat label={t.standings.goalsAgainst} value={record.goalsAgainst} />
      </div>

      <h2 className="mb-5 flex items-center gap-3">
        <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
        <span className="bg-flame-500 text-pitch-950 font-display text-lg px-4 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
          {t.teamDetail.fixtures}
        </span>
        <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {teamMatches.map((m) => {
          const homeInfo = m.homeCode ? teamByCode[m.homeCode] : undefined;
          const awayInfo = m.awayCode ? teamByCode[m.awayCode] : undefined;
          const hasResult = m.homeScore !== null && m.awayScore !== null;
          return (
            <article key={m.id} className="cromo-sm bg-paper-50 text-pitch-950 p-4">
              <div className="flex items-center justify-between gap-2 mb-3 text-[10px] font-mono uppercase tracking-widest text-pitch-700">
                <div className="flex items-center gap-2">
                  {m.groupName && (
                    <span className={`group-${m.groupName} px-2 py-0.5 rounded-sm`}>
                      {t.predictions.group.replace("{name}", m.groupName)}
                    </span>
                  )}
                  <span>{m.matchDate}</span>
                </div>
                {m.matchTime && <span>{m.matchTime}</span>}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 items-center">
                <div className="text-right min-w-0">
                  <div className="flex justify-end mb-1">
                    <TeamBadge
                      code={m.homeCode}
                      flag={m.homeFlag}
                      logoUrl={homeInfo?.logoUrl ?? null}
                      alt={m.homeTeam}
                      size="sm"
                    />
                  </div>
                  <div className="font-display uppercase text-xs leading-tight tracking-tight truncate">
                    {m.homeTeam}
                  </div>
                </div>
                <div className="font-display text-xl px-1 whitespace-nowrap tabular-nums shrink-0">
                  {hasResult ? (
                    <>
                      {m.homeScore}
                      <span className="text-brick-500 mx-1">·</span>
                      {m.awayScore}
                    </>
                  ) : (
                    <span className="text-pitch-400">{t.teamDetail.pendingVs}</span>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="flex justify-start mb-1">
                    <TeamBadge
                      code={m.awayCode}
                      flag={m.awayFlag}
                      logoUrl={awayInfo?.logoUrl ?? null}
                      alt={m.awayTeam}
                      size="sm"
                    />
                  </div>
                  <div className="font-display uppercase text-xs leading-tight tracking-tight truncate">
                    {m.awayTeam}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-right">
                <Link
                  href={`/g/${slug}/m/${m.matchNumber}`}
                  className="inline-block font-mono text-[10px] uppercase tracking-widest text-pitch-700 hover:text-flame-600 whitespace-nowrap"
                >
                  {t.predictions.matchDetail}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function RecordStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-3xl sm:text-4xl leading-none">{value}</div>
      <div className="font-mono text-[9px] text-pitch-500 uppercase tracking-widest mt-1.5">
        {label}
      </div>
    </div>
  );
}
