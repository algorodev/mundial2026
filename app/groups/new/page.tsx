import { redirect } from "next/navigation";
import Link from "next/link";
import { asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import NewGroupClient from "@/components/NewGroupClient";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

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

  const locale = await getLocale();
  const t = getDictionary(locale);

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
        className="back-link mb-4"
      >
        {t.groups.backToMyPools}
      </Link>
      <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none mb-8">
        {t.groups.newGroup.split(" ")[0]}{" "}
        <span className="text-pitch-600 dark:text-flame-500">{t.groups.newGroup.split(" ").slice(1).join(" ")}</span>
      </h1>
      {list.length === 0 ? (
        <div className="cromo bg-paper-50 text-pitch-700 p-8 text-center font-mono uppercase tracking-widest">
          {t.groups.noTournaments}
        </div>
      ) : (
        <NewGroupClient tournaments={list} preselectSlug={preselectSlug} />
      )}
    </div>
  );
}
