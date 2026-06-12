import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember } from "@/lib/group-access";
import GroupTabs from "@/components/GroupTabs";
import TournamentBadge from "@/components/TournamentBadge";
import TournamentStandings from "@/components/TournamentStandings";

export default async function GroupStandingsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/g/${params.slug}/standings`)}`);
  }

  const ctx = await getGroupForMember(params.slug, session.userId);
  if (!ctx) notFound();

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, ctx.tournamentId))
    .limit(1);
  if (!tournament) notFound();

  return (
    <div className="pt-8">
      <Link
        href="/groups"
        className="back-link mb-3"
      >
        ← Mis porras
      </Link>
      <div className="mb-6 flex items-start gap-4">
        <TournamentBadge
          slug={tournament.slug}
          name={tournament.name}
          size="xl"
          onDark
          className="shrink-0 mt-1"
        />
        <div className="min-w-0">
          <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
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

      {!tournament.apiLeagueId || !tournament.apiSeason ? (
        <div className="cromo bg-paper-50 text-pitch-950 p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-500">
            Este torneo no tiene clasificación sincronizada.
          </p>
        </div>
      ) : (
        <TournamentStandings tournamentSlug={tournament.slug} />
      )}
    </div>
  );
}
