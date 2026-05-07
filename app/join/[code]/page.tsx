import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import JoinClient from "@/components/JoinClient";

export default async function JoinPage({
  params,
}: {
  params: { code: string };
}) {
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
      tournamentName: tournaments.name,
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

  return (
    <div className="pt-12 max-w-md mx-auto">
      <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none mb-3 text-center">
        UNIRTE
      </h1>
      <p className="text-center text-chalk-300 mb-8">
        Vas a unirte al grupo:
      </p>
      <div className="cromo bg-paper-50 text-pitch-950 p-5 mb-8 text-center">
        <div className="font-display text-3xl uppercase tracking-tight">
          {group.name}
        </div>
        <div className="font-mono text-xs text-pitch-700 mt-1 uppercase tracking-widest">
          {group.tournamentName}
        </div>
      </div>
      <JoinClient code={code} />
    </div>
  );
}
