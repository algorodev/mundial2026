import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupMembers, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import TournamentBadge from "@/components/TournamentBadge";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

export default async function GroupsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();
  const t = getDictionary(locale);

  const myGroups = await db
    .select({
      slug: groups.slug,
      name: groups.name,
      tournamentName: tournaments.name,
      tournamentSlug: tournaments.slug,
      role: groupMembers.role,
      ownerId: groups.ownerId,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .innerJoin(tournaments, eq(groups.tournamentId, tournaments.id))
    .where(eq(groupMembers.userId, session.userId))
    .orderBy(asc(groupMembers.joinedAt));

  return (
    <div className="pt-8">
      <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
        <div>
          <h1 className="font-display text-6xl sm:text-7xl text-pitch-900 dark:text-chalk-50 leading-none">
            {t.groups.title.split(" ")[0]}{" "}
            <span className="text-pitch-600 dark:text-flame-500">{t.groups.title.split(" ").slice(1).join(" ")}</span>
          </h1>
          <p className="mt-3 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
            {myGroups.length === 0
              ? t.groups.empty
              : myGroups.length === 1
                ? t.groups.groupCount_one
                : t.groups.groupCount_other.replace("{count}", String(myGroups.length))}
          </p>
        </div>
        <Link href="/groups/new" className="btn-primary inline-flex items-center gap-2">
          {t.groups.createGroup}
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      </div>

      {myGroups.length === 0 && (
        <div className="cromo bg-paper-50 text-pitch-700 p-8 text-center font-mono uppercase tracking-widest">
          {t.groups.emptyState}
        </div>
      )}

      <div className="space-y-3">
        {myGroups.map((g) => (
          <Link
            key={g.slug}
            href={`/g/${g.slug}`}
            className="cromo bg-paper-50 text-pitch-950 p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
          >
            <TournamentBadge
              slug={g.tournamentSlug}
              name={g.tournamentName}
              size="lg"
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-display text-2xl uppercase tracking-tight truncate">
                {g.name}
              </div>
              <div className="mt-1 font-mono text-xs text-pitch-700 uppercase tracking-widest truncate">
                {g.tournamentName}
              </div>
            </div>
            {g.ownerId === session.userId && (
              <span className="shrink-0 bg-flame-500 text-pitch-950 font-display text-[10px] px-2 py-1 border-2 border-pitch-950 uppercase tracking-widest">
                {t.common.owner}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
