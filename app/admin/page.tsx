import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { tournaments, matches, groups } from "@/lib/db/schema";
import { asc, sql } from "drizzle-orm";
import TournamentBadge from "@/components/TournamentBadge";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isGlobalAdmin) redirect("/groups");

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
        <h1 className="font-display text-6xl sm:text-7xl text-chalk-50 leading-none">
          PANEL <span className="text-flame-500">ADMIN</span>
        </h1>
        <p className="mt-4 inline-block bg-brick-500 text-paper-50 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Torneos y resultados
        </p>
      </div>

      {list.length === 0 && (
        <div className="cromo bg-paper-50 text-pitch-700 p-8 text-center font-mono uppercase tracking-widest">
          No hay torneos. Crea uno desde el seed o por DB.
        </div>
      )}

      <div className="space-y-3">
        {list.map((t) => {
          const total = Number(t.total);
          const done = Number(t.done);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={t.id}
              href={`/admin/t/${t.slug}`}
              className="cromo bg-paper-50 text-pitch-950 p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
            >
              <TournamentBadge
                slug={t.slug}
                name={t.name}
                size="lg"
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-display text-2xl uppercase tracking-tight truncate">
                  {t.name}
                </div>
                <div className="mt-1 font-mono text-xs text-pitch-700 uppercase tracking-widest truncate">
                  {t.sport} · {t.status} · {Number(t.groupCount)} grupos
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-xl text-flame-500">
                  {done}/{total}
                </div>
                <div className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest">
                  {pct}% resultados
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
