import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { matches, predictions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import PredictionsClient from "@/components/PredictionsClient";
import {
  getTournamentStartIso,
  getTournamentStartLabel,
} from "@/lib/matches-data";

export default async function PredictionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.isAdmin) redirect("/admin");

  const [allMatches, myPreds] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.matchNumber)),
    db
      .select()
      .from(predictions)
      .where(eq(predictions.userId, session.userId)),
  ]);

  // Serializar fechas a string para evitar issues de hydration
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
      <div className="mb-10">
        <h1 className="font-display text-6xl sm:text-7xl text-chalk-50 leading-none">
          MIS <span className="text-flame-500">PRONÓSTICOS</span>
        </h1>
        <p className="mt-4 inline-block bg-paper-50 text-pitch-950 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Hola, {session.name}
        </p>
      </div>

      <PredictionsClient
        matches={matchesSerialized}
        initialPreds={predsMap}
        tournamentStartIso={getTournamentStartIso()}
        tournamentStartLabel={getTournamentStartLabel()}
      />
    </div>
  );
}
