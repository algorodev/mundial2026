import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LeaderboardClient from "@/components/LeaderboardClient";
import { getTournamentStart } from "@/lib/tournament";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tournamentStart = await getTournamentStart();

  return (
    <div className="pt-8">
      <div className="mb-10">
        <h1 className="font-display text-6xl sm:text-7xl text-chalk-50 leading-none">
          CLASIFI<span className="text-flame-500">CACIÓN</span>
        </h1>
        <p className="mt-4 inline-block bg-grass-500 text-paper-50 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest rotate-1">
          ● En directo
        </p>
      </div>

      <LeaderboardClient
        currentName={session.name}
        tournamentStartIso={tournamentStart.iso}
        tournamentStartLabel={tournamentStart.label}
      />
    </div>
  );
}
