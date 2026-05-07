import { redirect } from "next/navigation";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import NewGroupClient from "@/components/NewGroupClient";

export default async function NewGroupPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const list = await db
    .select({
      slug: tournaments.slug,
      name: tournaments.name,
      sport: tournaments.sport,
      status: tournaments.status,
    })
    .from(tournaments)
    .orderBy(asc(tournaments.createdAt));

  return (
    <div className="pt-8 max-w-xl mx-auto">
      <Link
        href="/groups"
        className="inline-block font-mono text-xs text-chalk-300 hover:text-flame-400 uppercase tracking-widest mb-4"
      >
        ← Mis porras
      </Link>
      <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none mb-8">
        NUEVO <span className="text-flame-500">GRUPO</span>
      </h1>
      {list.length === 0 ? (
        <div className="cromo bg-paper-50 text-pitch-700 p-8 text-center font-mono uppercase tracking-widest">
          No hay torneos disponibles. Pide al admin que cree uno.
        </div>
      ) : (
        <NewGroupClient tournaments={list} />
      )}
    </div>
  );
}
