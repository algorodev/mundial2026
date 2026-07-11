import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teams, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember } from "@/lib/group-access";
import GroupTabs from "@/components/GroupTabs";
import BackLink from "@/components/BackLink";
import TournamentBadge from "@/components/TournamentBadge";
import StatsClient from "@/components/StatsClient";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { titleOddsSorted, TITLE_ODDS_SNAPSHOT_DATE } from "@/lib/title-odds-2026";

export default async function GroupStatsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/g/${params.slug}/stats`)}`);
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

  // Forecast de campeón: solo tiene sentido para torneos cuyos equipos usan
  // los códigos FIFA de selecciones (el Mundial). En otros torneos (clubes)
  // simplemente no habrá match por código y la sección no se renderiza.
  const tournamentTeams = await db
    .select({ code: teams.code, name: teams.name, flagEmoji: teams.flagEmoji, logoUrl: teams.logoUrl })
    .from(teams)
    .where(eq(teams.tournamentId, ctx.tournamentId));
  const teamByCode = new Map(tournamentTeams.map((tm) => [tm.code, tm]));
  const forecast = titleOddsSorted()
    .map((o) => {
      const tm = teamByCode.get(o.code);
      return tm
        ? { code: o.code, pct: o.pct, name: tm.name, flag: tm.flagEmoji, logoUrl: tm.logoUrl }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 10);

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
        active="stats"
        isOwner={ctx.myRole === "owner"}
      />

      <StatsClient
        groupSlug={ctx.slug}
        forecast={forecast}
        forecastSnapshotDate={TITLE_ODDS_SNAPSHOT_DATE}
      />
    </div>
  );
}
