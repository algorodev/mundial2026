import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getTournamentStart } from "@/lib/tournament";
import { getGroupForMember, getPublicGroup } from "@/lib/group-access";
import LeaderboardClient from "@/components/LeaderboardClient";
import GroupTabs from "@/components/GroupTabs";
import LiveScoreboard from "@/components/LiveScoreboard";
import TournamentBadge from "@/components/TournamentBadge";

export const dynamic = "force-dynamic";

export default async function GroupLeaderboardPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const session = await getSession();

  // Resuelve contexto: si el visitante es miembro, vista completa con tabs.
  // Si no es miembro pero el grupo es público, vista de visitante (sin tabs).
  // Si nada de eso aplica, login o notFound.
  const memberCtx = session
    ? await getGroupForMember(params.slug, session.userId)
    : null;
  const publicCtx = memberCtx ? null : await getPublicGroup(params.slug);

  if (!memberCtx && !publicCtx) {
    if (!session) {
      redirect(
        `/login?next=${encodeURIComponent(`/g/${params.slug}/leaderboard`)}`
      );
    }
    notFound();
  }

  const groupName = memberCtx ? memberCtx.name : publicCtx!.name;
  const groupSlug = memberCtx ? memberCtx.slug : publicCtx!.slug;
  const tournamentId = memberCtx
    ? memberCtx.tournamentId
    : publicCtx!.tournamentId;
  const predictionsVisibility =
    memberCtx?.predictionsVisibility === "open" ? "open" : "hidden-until-lock";
  const isMember = !!memberCtx;
  const inviteCode = publicCtx?.inviteCode;

  const [tournament, start] = await Promise.all([
    db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1)
      .then((r) => r[0]),
    getTournamentStart(tournamentId),
  ]);

  return (
    <div className="pt-8">
      <Link
        href={isMember ? "/groups" : "/"}
        className="back-link mb-3"
      >
        ← {isMember ? "Mis porras" : "Volver"}
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
            {groupName}
          </h1>
          <p className="mt-3 inline-block bg-grass-500 text-paper-50 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest rotate-1">
            ● {tournament?.name}
          </p>
        </div>
      </div>

      {isMember ? (
        <GroupTabs
          slug={groupSlug}
          active="leaderboard"
          isOwner={memberCtx!.myRole === "owner"}
        />
      ) : (
        <PublicJoinBanner
          inviteCode={inviteCode!}
          tournamentFinished={tournament?.status === "finished"}
        />
      )}

      <LeaderboardClient
        groupSlug={groupSlug}
        currentName={session?.name ?? ""}
        tournamentStartIso={start?.iso ?? new Date(0).toISOString()}
        tournamentStartLabel={start?.label ?? ""}
        predictionsVisibility={predictionsVisibility}
      />
      <LiveScoreboard groupSlug={groupSlug} />
    </div>
  );
}

function PublicJoinBanner({
  inviteCode,
  tournamentFinished,
}: {
  inviteCode: string;
  tournamentFinished: boolean;
}) {
  if (tournamentFinished) return null;
  return (
    <div className="cromo bg-flame-500 text-pitch-950 p-5 sm:p-6 mb-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="font-display text-xl sm:text-2xl uppercase tracking-tight leading-tight">
          Porra Oficial · entrada libre
        </div>
        <p className="text-sm mt-1 opacity-80">
          Únete para pronosticar y aparecer en este ranking.
        </p>
      </div>
      <Link href={`/join/${inviteCode}`} className="btn-secondary shrink-0">
        Unirse →
      </Link>
    </div>
  );
}
