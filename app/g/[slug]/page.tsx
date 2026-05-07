import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, predictions, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getTournamentStart } from "@/lib/tournament";
import { getGroupForMember } from "@/lib/group-access";
import PredictionsClient from "@/components/PredictionsClient";
import GroupTabs from "@/components/GroupTabs";
import LiveScoreboard from "@/components/LiveScoreboard";
import TournamentBadge from "@/components/TournamentBadge";

export default async function GroupPredictionsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/g/${params.slug}`)}`);

  const ctx = await getGroupForMember(params.slug, session.userId);
  if (!ctx) notFound();

  const [tournament, allMatches, myPreds, start] = await Promise.all([
    db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, ctx.tournamentId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, ctx.tournamentId))
      .orderBy(asc(matches.matchNumber)),
    db
      .select()
      .from(predictions)
      .where(
        and(
          eq(predictions.userId, session.userId),
          eq(predictions.groupId, ctx.groupId)
        )
      ),
    getTournamentStart(ctx.tournamentId),
  ]);

  const matchesSerialized = allMatches.map((m) => ({
    ...m,
    kickoffAt: m.kickoffAt.toISOString(),
  }));

  const predsMap: Record<number, { homeScore: number; awayScore: number }> = {};
  for (const p of myPreds) {
    predsMap[p.matchId] = { homeScore: p.homeScore, awayScore: p.awayScore };
  }

  return (
    <div className="pt-8">
      <Link
        href="/groups"
        className="inline-block font-mono text-xs text-chalk-300 hover:text-flame-400 uppercase tracking-widest mb-3"
      >
        ← Mis porras
      </Link>
      <div className="mb-6 flex items-start gap-4">
        {tournament && (
          <TournamentBadge
            slug={tournament.slug}
            name={tournament.name}
            size="xl"
            onDark
            className="shrink-0 mt-1"
          />
        )}
        <div className="min-w-0">
          <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
            {ctx.name}
          </h1>
          <p className="mt-3 inline-block bg-paper-50 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
            {tournament?.name}
          </p>
        </div>
      </div>
      <GroupTabs
        slug={ctx.slug}
        active="predictions"
        isOwner={ctx.myRole === "owner"}
      />
      {matchesSerialized.length === 0 ? (
        <div className="cromo bg-paper-50 text-pitch-950 p-8 sm:p-10 text-center">
          <div className="font-display text-3xl sm:text-4xl mb-3">
            🗓 PRÓXIMAMENTE
          </div>
          <p className="font-mono text-xs sm:text-sm text-pitch-700 uppercase tracking-widest">
            El calendario de {tournament?.name} aún no se ha publicado.
            <br />
            Vuelve cuando arranque el torneo para empezar a pronosticar.
          </p>
        </div>
      ) : (
        <>
          <PredictionsClient
            groupSlug={ctx.slug}
            matches={matchesSerialized}
            initialPreds={predsMap}
            tournamentStartIso={start?.iso ?? new Date(0).toISOString()}
            tournamentStartLabel={start?.label ?? ""}
          />
          <LiveScoreboard groupSlug={ctx.slug} />
        </>
      )}
    </div>
  );
}
