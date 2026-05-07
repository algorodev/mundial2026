import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    // Si estás logado, te llevamos a tus porras directamente.
    redirect("/groups");
  }

  const [counts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tournaments);
  const totalTournaments = Number(counts?.count ?? 0);

  return (
    <div className="pt-10 sm:pt-16 overflow-x-hidden">
      <section className="relative">
        <div className="band bg-brick-500" style={{ top: "30%" }} />
        <div
          className="band bg-flame-500"
          style={{ top: "55%", transform: "rotate(2deg)" }}
        />

        <div className="text-center max-w-4xl mx-auto relative">
          <Image
            src="/brand/porrabros-logo-principal.svg"
            alt="PorraBros"
            width={1200}
            height={1200}
            priority
            unoptimized
            className="mx-auto w-[260px] sm:w-[420px] h-auto drop-shadow-2xl"
          />

          <p className="mt-10 text-chalk-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Crea una porra con tu pandilla, compañeros de oficina o familia.
            Elige torneo, invita por enlace,{" "}
            <strong className="text-flame-500">pronostica</strong> y compite por
            ser el mejor.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="btn-primary">
              Empezar →
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-24 sm:mt-32 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal -rotate-1">
            📐 REGLAS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <RuleCromo
            num="3"
            title="EXACTO"
            desc="Predices 2-1 y queda 2-1."
            color="grass"
            rotate="-rotate-2"
          />
          <RuleCromo
            num="1"
            title="SIGNO"
            desc="Aciertas el ganador (o el empate) pero no el resultado."
            color="mustard"
            rotate="rotate-1"
          />
          <RuleCromo
            num="0"
            title="FALLO"
            desc="Ni resultado ni signo. Lo siento."
            color="brick"
            rotate="-rotate-1"
          />
        </div>

        <p className="mt-12 text-center font-mono text-sm text-chalk-400 uppercase tracking-widest">
          ⏰ Pronósticos cerrados al pitido del primer partido
        </p>
      </section>

      {totalTournaments > 0 && (
        <p className="mt-16 text-center font-mono text-[11px] text-chalk-500 uppercase tracking-widest">
          {totalTournaments} torneo{totalTournaments === 1 ? "" : "s"} disponible
          {totalTournaments === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function RuleCromo({
  num,
  title,
  desc,
  color,
  rotate,
}: {
  num: string;
  title: string;
  desc: string;
  color: "grass" | "mustard" | "brick";
  rotate: string;
}) {
  const numStyles = {
    grass: "bg-grass-500 text-paper-50",
    mustard: "bg-flame-500 text-pitch-950",
    brick: "bg-brick-500 text-paper-50",
  };
  return (
    <article
      className={`cromo bg-paper-50 text-pitch-950 ${rotate} p-5 hover:rotate-0 hover:-translate-y-1 transition-all`}
    >
      <div
        className={`${numStyles[color]} w-24 h-24 flex items-center justify-center font-display text-7xl border-2 border-pitch-950 shadow-brutal-sm mb-5`}
      >
        {num}
      </div>
      <div className="font-display text-3xl">{title}</div>
      <div className="text-sm mt-2 opacity-70 leading-relaxed">{desc}</div>
    </article>
  );
}
