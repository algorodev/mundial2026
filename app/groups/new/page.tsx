import { redirect } from "next/navigation";
import Link from "next/link";
import { asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import NewGroupClient from "@/components/NewGroupClient";

export default async function NewGroupPage({
  searchParams,
}: {
  searchParams: { preselect?: string };
}) {
  const session = await getSession();
  if (!session) {
    const next = searchParams.preselect
      ? `/groups/new?preselect=${encodeURIComponent(searchParams.preselect)}`
      : "/groups/new";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  // Solo torneos abiertos a inscripción — ni los que aún no tienen calendario
  // ni los que ya han terminado.
  const list = await db
    .select({
      slug: tournaments.slug,
      name: tournaments.name,
      sport: tournaments.sport,
      status: tournaments.status,
    })
    .from(tournaments)
    .where(inArray(tournaments.status, ["upcoming", "live"]))
    .orderBy(asc(tournaments.createdAt));

  const preselectSlug =
    searchParams.preselect && list.some((t) => t.slug === searchParams.preselect)
      ? searchParams.preselect
      : null;

  return (
    <div className="pt-8">
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
        <NewGroupClient tournaments={list} preselectSlug={preselectSlug} />
      )}
    </div>
  );
}
