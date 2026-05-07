import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupMembers, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

export default async function GroupsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const myGroups = await db
    .select({
      slug: groups.slug,
      name: groups.name,
      tournamentName: tournaments.name,
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
          <h1 className="font-display text-6xl sm:text-7xl text-chalk-50 leading-none">
            MIS <span className="text-flame-500">PORRAS</span>
          </h1>
          <p className="mt-3 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
            {myGroups.length === 0
              ? "Aún no estás en ninguna"
              : `${myGroups.length} grupo${myGroups.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link href="/groups/new" className="btn-primary">
          + Crear grupo
        </Link>
      </div>

      {myGroups.length === 0 && (
        <div className="cromo bg-paper-50 text-pitch-700 p-8 text-center font-mono uppercase tracking-widest">
          Crea tu primer grupo o pide a un amigo el enlace de invitación.
        </div>
      )}

      <div className="space-y-3">
        {myGroups.map((g) => (
          <Link
            key={g.slug}
            href={`/g/${g.slug}`}
            className="cromo bg-paper-50 text-pitch-950 p-5 flex items-center justify-between hover:-translate-y-0.5 transition-transform"
          >
            <div>
              <div className="font-display text-2xl uppercase tracking-tight">
                {g.name}
              </div>
              <div className="mt-1 font-mono text-xs text-pitch-700 uppercase tracking-widest">
                {g.tournamentName}
              </div>
            </div>
            {g.ownerId === session.userId && (
              <span className="bg-flame-500 text-pitch-950 font-display text-[10px] px-2 py-1 border-2 border-pitch-950 uppercase tracking-widest">
                Owner
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
