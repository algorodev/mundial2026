import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getTournamentStart } from "@/lib/tournament";
import { getGroupForMember } from "@/lib/group-access";
import LeaderboardClient from "@/components/LeaderboardClient";
import GroupTabs from "@/components/GroupTabs";
import LiveScoreboard from "@/components/LiveScoreboard";

export const dynamic = "force-dynamic";

export default async function GroupLeaderboardPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();
  if (!session)
    redirect(
      `/login?next=${encodeURIComponent(`/g/${params.slug}/leaderboard`)}`
    );

  const ctx = await getGroupForMember(params.slug, session.userId);
  if (!ctx) notFound();

  const [tournament, start] = await Promise.all([
    db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, ctx.tournamentId))
      .limit(1)
      .then((r) => r[0]),
    getTournamentStart(ctx.tournamentId),
  ]);

  return (
    <div className="pt-8">
      <Link
        href="/groups"
        className="inline-block font-mono text-xs text-chalk-300 hover:text-flame-400 uppercase tracking-widest mb-3"
      >
        ← Mis porras
      </Link>
      <div className="mb-6">
        <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
          {ctx.name}
        </h1>
        <p className="mt-3 inline-block bg-grass-500 text-paper-50 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest rotate-1">
          ● {tournament?.name}
        </p>
      </div>
      <GroupTabs
        slug={ctx.slug}
        active="leaderboard"
        isOwner={ctx.myRole === "owner"}
      />
      <LeaderboardClient
        groupSlug={ctx.slug}
        currentName={session.name}
        tournamentStartIso={start?.iso ?? new Date(0).toISOString()}
        tournamentStartLabel={start?.label ?? ""}
      />
      <LiveScoreboard groupSlug={ctx.slug} />
    </div>
  );
}
