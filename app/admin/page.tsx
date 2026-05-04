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
      <h1 className="font-display text-5xl text-chalk-50 mb-1">
        Panel Admin
      </h1>
      <p className="text-chalk-400 font-mono text-xs uppercase tracking-widest mb-8">
        Gestión de la porra
      </p>
      <AdminClient
        matches={matchesSerialized}
        participants={participantsSerialized}
      />
    </div>
  );
}
