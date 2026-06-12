import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { tournaments, matches, teams } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import AdminResultsClient from "@/components/AdminResultsClient";
import TournamentBadge from "@/components/TournamentBadge";

export default async function AdminTournamentPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const params = await props.params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isGlobalAdmin) redirect("/groups");

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, params.slug))
    .limit(1);

  if (!tournament) notFound();

  const [allMatches, tournamentTeams] = await Promise.all([
    db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournament.id))
      .orderBy(asc(matches.matchNumber)),
    db
      .select({ code: teams.code, logoUrl: teams.logoUrl })
      .from(teams)
      .where(eq(teams.tournamentId, tournament.id)),
  ]);

  const matchesSerialized = allMatches.map((m) => ({
    ...m,
    kickoffAt: m.kickoffAt.toISOString(),
  }));

  const teamLogos: Record<string, string> = {};
  for (const t of tournamentTeams) {
    if (t.logoUrl) teamLogos[t.code] = t.logoUrl;
  }

  return (
    <div className="pt-8">
      <Link
        href="/admin"
        className="back-link mb-4"
      >
        ← Torneos
      </Link>
      <div className="mb-10 flex items-start gap-4">
        <TournamentBadge
          slug={tournament.slug}
          name={tournament.name}
          size="xl"
          onDark
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
        teamLogos={teamLogos}
      />
    </div>
  );
}
