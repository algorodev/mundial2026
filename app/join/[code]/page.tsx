import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
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
        <h1 className="font-display text-5xl text-chalk-50 mb-4">CÓDIGO NO VÁLIDO</h1>
        <p className="text-chalk-300 mb-6">
          El enlace no es correcto o el grupo ya no existe.
        </p>
        <Link href="/groups" className="btn-primary">
          Ir a mis porras
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
      <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none mb-3 text-center">
        UNIRTE
      </h1>
      <p className="text-center text-chalk-300 mb-8">
        {closed
          ? "Este grupo ya no acepta inscripciones."
          : requiresApproval
            ? "Vas a solicitar entrar al grupo:"
            : "Vas a unirte al grupo:"}
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
          Volver a mis porras
        </Link>
      ) : (
        <JoinClient
          code={code}
          requiresApproval={requiresApproval}
          deadlineLabel={
            group.joinDeadline
              ? new Intl.DateTimeFormat("es-ES", {
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
