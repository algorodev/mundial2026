import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import JoinClient from "@/components/JoinClient";

export default async function JoinPage(
  props: {
    params: Promise<{ code: string }>;
  }
) {
  const params = await props.params;
  const code = params.code.toUpperCase();
  const session = await getSession();

  // Si no estoy logado, mando a login con ?next=/join/CODE
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`);
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  const [group] = await db
    .select({
      slug: groups.slug,
      name: groups.name,
      description: groups.description,
      tournamentName: tournaments.name,
      tournamentStatus: tournaments.status,
      joinPolicy: groups.joinPolicy,
      joinDeadline: groups.joinDeadline,
    })
    .from(groups)
    .innerJoin(tournaments, eq(groups.tournamentId, tournaments.id))
    .where(eq(groups.inviteCode, code))
    .limit(1);

  if (!group) {
    return (
      <div className="pt-12 max-w-md mx-auto text-center">
        <h1 className="font-display text-5xl text-pitch-900 dark:text-chalk-50 mb-4">
          {t.join.invalidCode}
        </h1>
        <p className="text-pitch-500 dark:text-chalk-400 mb-6">
          {t.join.invalidCodeDesc}
        </p>
        <Link href="/groups" className="btn-primary inline-flex items-center gap-2">
          {t.join.goToMyPools}
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      </div>
    );
  }

  const deadlineExpired =
    group.joinDeadline && Date.now() > group.joinDeadline.getTime();
  const closed =
    group.joinPolicy === "closed" ||
    !!deadlineExpired ||
    group.tournamentStatus === "finished";
  const requiresApproval = group.joinPolicy === "approval";

  return (
    <div className="pt-12 max-w-md mx-auto">
      <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none mb-3 text-center">
        {t.join.title}
      </h1>
      <p className="text-center text-pitch-500 dark:text-chalk-400 mb-8">
        {closed
          ? t.join.closed
          : requiresApproval
            ? t.join.requestEntry
            : t.join.joinGroup}
      </p>
      <div className="cromo bg-paper-50 text-pitch-950 p-5 mb-8 text-center">
        <div className="font-display text-3xl uppercase tracking-tight">
          {group.name}
        </div>
        <div className="font-mono text-xs text-pitch-700 mt-1 uppercase tracking-widest">
          {group.tournamentName}
        </div>
        {group.description && (
          <p className="mt-3 text-sm text-pitch-700 whitespace-pre-line">
            {group.description}
          </p>
        )}
      </div>
      {closed ? (
        <Link href="/groups" className="btn-secondary w-full block text-center">
          {t.join.backToMyPools}
        </Link>
      ) : (
        <JoinClient
          code={code}
          requiresApproval={requiresApproval}
          deadlineLabel={
            group.joinDeadline
              ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Madrid",
                }).format(group.joinDeadline)
              : null
          }
        />
      )}
    </div>
  );
}
