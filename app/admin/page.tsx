import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { tournaments, matches, groups } from "@/lib/db/schema";
import { asc, sql } from "drizzle-orm";
import TournamentBadge from "@/components/TournamentBadge";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isGlobalAdmin) redirect("/groups");

  const locale = await getLocale();
  const t = getDictionary(locale);

  const list = await db
    .select({
      id: tournaments.id,
      slug: tournaments.slug,
      name: tournaments.name,
      sport: tournaments.sport,
      status: tournaments.status,
      total: sql<number>`(select count(*) from ${matches} where ${matches.tournamentId} = ${tournaments.id})`,
      done: sql<number>`(select count(*) from ${matches} where ${matches.tournamentId} = ${tournaments.id} and ${matches.homeScore} is not null)`,
      groupCount: sql<number>`(select count(*) from ${groups} where ${groups.tournamentId} = ${tournaments.id})`,
    })
    .from(tournaments)
    .orderBy(asc(tournaments.createdAt));

  return (
    <div className="pt-8">
      <div className="mb-10">
        <h1 className="font-display text-6xl sm:text-7xl text-pitch-900 dark:text-chalk-50 leading-none">
          PANEL <span className="text-flame-500">ADMIN</span>
        </h1>
        <p className="mt-4 inline-block bg-brick-500 text-paper-50 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {t.admin.tagline}
        </p>
      </div>

      {list.length === 0 && (
        <div className="cromo bg-paper-50 text-pitch-700 p-8 text-center font-mono uppercase tracking-widest">
          {t.admin.noTournaments}
        </div>
      )}

      <div className="space-y-3">
        {list.map((tournament) => {
          const total = Number(tournament.total);
          const done = Number(tournament.done);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={tournament.id}
              href={`/admin/t/${tournament.slug}`}
              className="cromo bg-paper-50 text-pitch-950 p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
            >
              <TournamentBadge
                slug={tournament.slug}
                name={tournament.name}
                size="lg"
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl uppercase tracking-tight truncate">
                  {tournament.name}
                </div>
                <div className="mt-1 font-mono text-xs text-pitch-700 uppercase tracking-widest truncate">
                  {tournament.sport} · {tournament.status} · {Number(tournament.groupCount)} {t.admin.groups}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-xl text-flame-500">
                  {done}/{total}
                </div>
                <div className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest">
                  {pct}{t.admin.resultsPercent}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
