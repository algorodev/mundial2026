import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { tournaments, matches } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import AdminResultsClient from "@/components/AdminResultsClient";
import TournamentBadge from "@/components/TournamentBadge";

export default async function AdminTournamentPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isGlobalAdmin) redirect("/groups");

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, params.slug))
    .limit(1);

  if (!tournament) notFound();

  const allMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.tournamentId, tournament.id))
    .orderBy(asc(matches.matchNumber));

  const matchesSerialized = allMatches.map((m) => ({
    ...m,
    kickoffAt: m.kickoffAt.toISOString(),
  }));

  return (
    <div className="pt-8">
      <Link
        href="/admin"
        className="inline-block font-mono text-xs text-chalk-300 hover:text-flame-400 uppercase tracking-widest mb-4"
      >
        ← Torneos
      </Link>
      <div className="mb-10 flex items-start gap-4">
        <TournamentBadge
          slug={tournament.slug}
          name={tournament.name}
          size="xl"
          className="shrink-0 mt-1"
        />
        <div className="min-w-0">
          <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
            {tournament.name}
          </h1>
          <p className="mt-3 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
            Resultados
          </p>
        </div>
      </div>
      <AdminResultsClient
        tournamentSlug={tournament.slug}
        matches={matchesSerialized}
      />
    </div>
  );
}
