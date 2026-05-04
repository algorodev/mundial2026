import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { matches, users } from "@/lib/db/schema";
import { asc, eq, ne } from "drizzle-orm";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/");

  const [allMatches, participants] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.matchNumber)),
    db.select().from(users).where(eq(users.isAdmin, 0)),
  ]);

  const matchesSerialized = allMatches.map((m) => ({
    ...m,
    kickoffAt: m.kickoffAt.toISOString(),
  }));

  const participantsSerialized = participants.map((u) => ({
    id: u.id,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="pt-8">
      <div className="mb-10">
        <h1 className="font-display text-6xl sm:text-7xl text-chalk-50 leading-none">
          PANEL <span className="text-flame-500">ADMIN</span>
        </h1>
        <p className="mt-4 inline-block bg-brick-500 text-paper-50 font-display text-[11px] px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Gestión de la porra
        </p>
      </div>
      <AdminClient
        matches={matchesSerialized}
        participants={participantsSerialized}
      />
    </div>
  );
}
