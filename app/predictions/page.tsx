import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { matches, predictions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import PredictionsClient from "@/components/PredictionsClient";

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
      <div className="mb-8">
        <h1 className="font-display text-5xl text-chalk-50 mb-1">
          Mis Pronósticos
        </h1>
        <p className="text-chalk-400 font-mono text-xs uppercase tracking-widest">
          Hola, {session.name}
        </p>
      </div>

      <PredictionsClient
        matches={matchesSerialized}
        initialPreds={predsMap}
      />
    </div>
  );
}
