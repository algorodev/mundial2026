import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LeaderboardClient from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="pt-8">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-5xl text-chalk-50 mb-1">
            Clasificación
          </h1>
          <p className="text-chalk-400 font-mono text-xs uppercase tracking-widest">
            Ranking en directo
          </p>
        </div>
      </div>

      <LeaderboardClient currentName={session.name} />
    </div>
  );
}
