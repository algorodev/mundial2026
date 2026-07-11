import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, predictions, teams, tournaments, groups } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getPhaseStarts, phaseStartMs } from "@/lib/tournament";
import { MAIN_PHASE } from "@/lib/knockout-phases";
import { isMatchLocked } from "@/lib/lock";
import { getGroupForMember, getPublicGroup } from "@/lib/group-access";
import BackLink from "@/components/BackLink";
import PredictionsClient from "@/components/PredictionsClient";
import GroupTabs from "@/components/GroupTabs";
import LiveScoreboard from "@/components/LiveScoreboard";
import TeamCarousel from "@/components/TeamCarousel";
import TournamentBadge from "@/components/TournamentBadge";
import PushOptIn from "@/components/PushOptIn";
import { getLocale } from "@/lib/locale";
import { getDictionary, type Dictionary } from "@/lib/i18n";

export default async function GroupPredictionsPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session) {
    // Si el grupo es público, mandamos directo al leaderboard (visible sin
    // sesión) en vez de forzar el login para el flow de predicciones.
    const pub = await getPublicGroup(params.slug);
    if (pub) redirect(`/g/${params.slug}/leaderboard`);
    redirect(`/login?next=${encodeURIComponent(`/g/${params.slug}`)}`);
  }

  const ctx = await getGroupForMember(params.slug, session.userId);
  if (!ctx) {
    // Logado pero no miembro: si es público, leaderboard; si no, 404.
    const pub = await getPublicGroup(params.slug);
    if (pub) redirect(`/g/${params.slug}/leaderboard`);
    notFound();
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  const [tournament, group, allMatches, myPreds, tournamentTeams, phaseStarts] =
    await Promise.all([
      db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, ctx.tournamentId))
        .limit(1)
        .then((r) => r[0]),
      db
        .select({ description: groups.description })
        .from(groups)
        .where(eq(groups.id, ctx.groupId))
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
      db
        .select()
        .from(teams)
        .where(eq(teams.tournamentId, ctx.tournamentId))
        .orderBy(asc(teams.id)),
      getPhaseStarts(ctx.tournamentId),
    ]);
  const start = phaseStarts[MAIN_PHASE] ?? null;

  const teamLogos: Record<string, string> = {};
  for (const tm of tournamentTeams) {
    if (tm.logoUrl) teamLogos[tm.code] = tm.logoUrl;
  }

  const matchesSerialized = allMatches.map((m) => ({
    ...m,
    kickoffAt: m.kickoffAt.toISOString(),
  }));

  const predsMap: Record<number, { homeScore: number; awayScore: number; homeScoreAet: number | null; awayScoreAet: number | null; penaltyHome: number | null; penaltyAway: number | null }> = {};
  for (const p of myPreds) {
    predsMap[p.matchId] = {
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      homeScoreAet: p.homeScoreAet,
      awayScoreAet: p.awayScoreAet,
      penaltyHome: p.penaltyHome,
      penaltyAway: p.penaltyAway,
    };
  }

  // Quinielómetro: cuántos pronósticos abiertos (todavía sin bloquear)
  // tienes rellenados. Anima a completar antes del cierre. Snapshot del
  // momento de carga de la página — no hace falta que sea live.
  const lockLookup =
    ctx.predictionLockMode === "tournament-start"
      ? (groupName: string | null) => phaseStartMs(phaseStarts, groupName)
      : null;
  const openMatches = allMatches.filter((m) => !isMatchLocked(m, ctx, lockLookup));
  const meterDone = openMatches.filter((m) => predsMap[m.id] !== undefined).length;
  const meterTotal = openMatches.length;

  return (
    <div className="pt-8">
      <BackLink href="/groups" className="mb-3">
        {t.leaderboard.backToMyPools}
      </BackLink>
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
          <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none">
            {ctx.name}
          </h1>
          <p className="mt-3 inline-block bg-paper-50 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
            {tournament?.name}
          </p>
          {group?.description && (
            <p className="mt-3 text-sm text-pitch-700 dark:text-chalk-300 whitespace-pre-line max-w-2xl">
              {group.description}
            </p>
          )}
        </div>
      </div>
      <GroupTabs
        slug={ctx.slug}
        active="predictions"
        isOwner={ctx.myRole === "owner"}
      />
      <PushOptIn />
      <TeamCarousel
        groupSlug={ctx.slug}
        teams={tournamentTeams.map((tm) => ({
          code: tm.code,
          name: tm.name,
          flagEmoji: tm.flagEmoji,
          logoUrl: tm.logoUrl,
        }))}
        labelPrev={t.teamDetail.prevTeam}
        labelNext={t.teamDetail.nextTeam}
      />
      {matchesSerialized.length === 0 ? (
        <div className="cromo bg-paper-50 text-pitch-950 p-8 sm:p-10 text-center">
          <div className="font-display text-3xl sm:text-4xl mb-3">
            {t.predictions.comingSoon}
          </div>
          <p className="font-mono text-xs sm:text-sm text-pitch-700 uppercase tracking-widest">
            {t.predictions.comingSoonDesc
              .replace("{name}", tournament?.name ?? "")
              .split("\n")
              .map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
          </p>
        </div>
      ) : (
        <>
          {meterTotal > 0 && (
            <PredictionsMeter done={meterDone} total={meterTotal} t={t} />
          )}
          <PredictionsClient
            groupSlug={ctx.slug}
            matches={matchesSerialized}
            initialPreds={predsMap}
            teamLogos={teamLogos}
            tournamentStartIso={start?.iso ?? new Date(0).toISOString()}
            tournamentStartLabel={start?.label ?? ""}
            phaseStarts={phaseStarts}
            predictionLockMode={ctx.predictionLockMode}
            lockMinutesBefore={ctx.lockMinutesBefore}
            knockoutScoring={(ctx.knockoutScoring ?? tournament?.knockoutScoring ?? "fulltime") as "fulltime" | "extended"}
          />
          <LiveScoreboard groupSlug={ctx.slug} />
        </>
      )}
    </div>
  );
}

// Quinielómetro: medidor simple de cuántos pronósticos abiertos llevas
// rellenados, para animar a completar antes de que cierren. Server component
// puro (snapshot del momento de carga), no hace falta que sea interactivo.
function PredictionsMeter({
  done,
  total,
  t,
}: {
  done: number;
  total: number;
  t: Dictionary;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="cromo bg-paper-50 text-pitch-950 p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="font-display uppercase text-sm tracking-tight">
          {t.predictions.meter.title}
        </span>
        <span className="font-mono text-xs tabular-nums text-pitch-700">
          {done}/{total}
        </span>
      </div>
      <div className="h-3 bg-pitch-100 rounded-sm overflow-hidden">
        <div
          className="h-full bg-grass-500 transition-all"
          style={{ width: `${Math.max(pct > 0 ? 3 : 0, pct)}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-pitch-500">
        {t.predictions.meter.desc
          .replace("{done}", String(done))
          .replace("{total}", String(total))}
      </p>
    </div>
  );
}
