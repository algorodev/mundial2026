import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  groups,
  groupMembers,
  tournaments,
  matches,
  predictions,
} from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { calcPoints } from "@/lib/scoring";
import ProfileClient from "@/components/ProfileClient";
import TournamentBadge from "@/components/TournamentBadge";
import BackLink from "@/components/BackLink";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/profile");

  const locale = await getLocale();
  const t = getDictionary(locale);

  // Datos básicos del user
  const [me] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!me) redirect("/login");

  // Mis grupos
  const myGroups = await db
    .select({
      groupId: groups.id,
      slug: groups.slug,
      name: groups.name,
      tournamentId: groups.tournamentId,
      tournamentName: tournaments.name,
      tournamentSlug: tournaments.slug,
      tournamentStatus: tournaments.status,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .innerJoin(tournaments, eq(groups.tournamentId, tournaments.id))
    .where(eq(groupMembers.userId, session.userId));

  // Para cada grupo, calcular el ranking completo (igual que el leaderboard)
  // y de ahí sacar mi posición + mis stats. Hacemos las queries en paralelo.
  const groupCards = await Promise.all(
    myGroups.map(async (g) => {
      const [memberRows, allMatches, allPreds] = await Promise.all([
        db
          .select({ userId: users.id, name: users.name })
          .from(groupMembers)
          .innerJoin(users, eq(groupMembers.userId, users.id))
          .where(eq(groupMembers.groupId, g.groupId)),
        db
          .select()
          .from(matches)
          .where(eq(matches.tournamentId, g.tournamentId)),
        db
          .select()
          .from(predictions)
          .where(eq(predictions.groupId, g.groupId)),
      ]);

      const matchById = new Map(allMatches.map((m) => [m.id, m]));
      type Row = {
        userId: number;
        name: string | null;
        total: number;
        exact: number;
        outcome: number;
        miss: number;
        played: number;
      };
      const stats = new Map<number, Row>();
      for (const m of memberRows) {
        stats.set(m.userId, {
          userId: m.userId,
          name: m.name,
          total: 0,
          exact: 0,
          outcome: 0,
          miss: 0,
          played: 0,
        });
      }
      for (const p of allPreds) {
        const s = stats.get(p.userId);
        if (!s) continue;
        const m = matchById.get(p.matchId);
        if (!m || m.homeScore == null || m.awayScore == null) continue;
        const { points, result } = calcPoints(
          p.homeScore,
          p.awayScore,
          m.homeScore,
          m.awayScore
        );
        s.total += points;
        s.played += 1;
        if (result === "exact") s.exact += 1;
        else if (result === "outcome") s.outcome += 1;
        else if (result === "miss") s.miss += 1;
      }

      const ranked = Array.from(stats.values()).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        if (b.exact !== a.exact) return b.exact - a.exact;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });

      let prevTotal: number | null = null;
      let prevExact: number | null = null;
      let prevPos = 0;
      const withPos = ranked.map((row, idx) => {
        const tied =
          prevTotal !== null &&
          row.total === prevTotal &&
          row.exact === prevExact;
        const pos = tied ? prevPos : idx + 1;
        prevTotal = row.total;
        prevExact = row.exact;
        prevPos = pos;
        return { ...row, position: pos };
      });

      const myRow = withPos.find((r) => r.userId === session.userId);

      return {
        slug: g.slug,
        name: g.name,
        tournamentName: g.tournamentName,
        tournamentSlug: g.tournamentSlug,
        tournamentStatus: g.tournamentStatus,
        memberCount: memberRows.length,
        myPosition: myRow?.position ?? null,
        myTotal: myRow?.total ?? 0,
        myExact: myRow?.exact ?? 0,
        myOutcome: myRow?.outcome ?? 0,
        myMiss: myRow?.miss ?? 0,
        myPlayed: myRow?.played ?? 0,
        isWinner: g.tournamentStatus === "finished" && myRow?.position === 1,
      };
    })
  );

  // Stats agregadas a través de TODAS mis porras
  const totals = groupCards.reduce(
    (acc, g) => ({
      points: acc.points + g.myTotal,
      exact: acc.exact + g.myExact,
      outcome: acc.outcome + g.myOutcome,
      miss: acc.miss + g.myMiss,
      played: acc.played + g.myPlayed,
      groups: acc.groups + 1,
      wins: acc.wins + (g.isWinner ? 1 : 0),
    }),
    { points: 0, exact: 0, outcome: 0, miss: 0, played: 0, groups: 0, wins: 0 }
  );

  const players = t.groups.players;

  return (
    <div className="pt-8">
      <BackLink href="/groups" className="mb-3">
        {t.profile.backToMyPools}
      </BackLink>

      <div className="mb-10">
        <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none">
          {t.profile.title.split(" ")[0]}{" "}
          <span className="text-pitch-600 dark:text-flame-500">
            {t.profile.title.split(" ").slice(1).join(" ")}
          </span>
        </h1>
        <p className="mt-3 inline-block bg-paper-50 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {me.email}
        </p>
      </div>

      {/* Form de cambiar nombre */}
      <section className="mb-12 max-w-xl">
        <h2 className="font-display text-2xl text-pitch-900 dark:text-chalk-50 mb-4 uppercase">
          {t.profile.yourName}
        </h2>
        <ProfileClient initialName={me.name} />
      </section>

      {/* Stats globales */}
      <section className="mb-12">
        <h2 className="font-display text-2xl text-pitch-900 dark:text-chalk-50 mb-4 uppercase">
          {t.profile.globalStats}
        </h2>
        <div className="cromo bg-paper-50 dark:bg-pitch-900 p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <Stat label={t.profile.statPoints} value={totals.points} accent="text-pitch-700 dark:text-flame-500" big />
          <Stat label={t.profile.statWins} value={totals.wins} accent="text-grass-400" big />
          <Stat label={t.profile.statPools} value={totals.groups} accent="text-pitch-900 dark:text-chalk-50" />
          <Stat label={t.profile.statPlayed} value={totals.played} accent="text-pitch-900 dark:text-chalk-50" />
          <Stat label={t.profile.statExact} value={totals.exact} accent="text-grass-400" />
          <Stat label={t.profile.statOutcome} value={totals.outcome} accent="text-pitch-700 dark:text-flame-400" />
          <Stat label={t.profile.statMiss} value={totals.miss} accent="text-brick-400" />
          <Stat
            label={t.profile.statAccuracy}
            value={
              totals.played > 0
                ? `${Math.round(
                    ((totals.exact + totals.outcome) / totals.played) * 100
                  )}%`
                : "—"
            }
            accent="text-pitch-900 dark:text-chalk-50"
          />
        </div>
      </section>

      {/* Lista de porras con mi posición */}
      <section>
        <h2 className="font-display text-2xl text-pitch-900 dark:text-chalk-50 mb-4 uppercase">
          {t.profile.myPools.replace("{count}", String(groupCards.length))}
        </h2>
        {groupCards.length === 0 ? (
          <div className="cromo bg-paper-50 text-pitch-700 p-6 text-center font-mono uppercase tracking-widest">
            {t.profile.emptyPools}
          </div>
        ) : (
          <div className="space-y-3">
            {groupCards.map((g) => (
              <Link
                key={g.slug}
                href={`/g/${g.slug}/leaderboard`}
                className="cromo bg-paper-50 dark:bg-pitch-800 text-pitch-950 dark:text-chalk-50 p-4 sm:p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
              >
                <TournamentBadge
                  slug={g.tournamentSlug}
                  name={g.tournamentName}
                  size="md"
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl uppercase tracking-tight truncate">
                    {g.name}
                    {g.isWinner && (
                      <span className="ml-2 text-base">🏆</span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-pitch-700 dark:text-chalk-400 uppercase tracking-widest truncate">
                    {g.tournamentName} · {g.memberCount} {players}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-lg text-pitch-700 dark:text-flame-500">
                    {g.myPosition != null ? `#${g.myPosition}` : "—"}
                    <span className="font-mono text-[11px] text-pitch-700 dark:text-chalk-400 ml-1">
                      / {g.memberCount}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-pitch-700 dark:text-chalk-400 uppercase tracking-widest">
                    {g.myTotal} {t.common.pts}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  big = false,
}: {
  label: string;
  value: number | string;
  accent: string;
  big?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-display ${
          big ? "text-5xl sm:text-6xl" : "text-3xl sm:text-4xl"
        } leading-none ${accent}`}
      >
        {value}
      </div>
      <div className="font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest mt-2">
        {label}
      </div>
    </div>
  );
}
