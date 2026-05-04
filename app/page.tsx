import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export default async function HomePage() {
  const session = await getSession();
  const totalMatches = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches);
  const total = totalMatches[0]?.count ?? 0;

  return (
    <div className="pt-10 sm:pt-16 overflow-x-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="band bg-brick-500" style={{ top: "30%" }} />
        <div className="band bg-flame-500" style={{ top: "55%", transform: "rotate(2deg)" }} />

        <div className="text-center max-w-4xl mx-auto relative">
          <span className="inline-block bg-flame-500 text-pitch-950 font-display text-xs tracking-widest px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm mb-6 -rotate-2">
            ⚽ JUNIO 2026 · NORTEAMÉRICA
          </span>

          <h1 className="font-display text-7xl sm:text-9xl text-chalk-50 leading-[0.85]">
            LA <span className="text-flame-500">PORRA</span>
          </h1>
          <h2 className="font-sport text-5xl sm:text-7xl text-paper-50 leading-none mt-2">
            DEL{" "}
            <span className="bg-brick-500 text-paper-50 px-4 py-1 inline-block -rotate-1 border-2 border-pitch-950 shadow-brutal">
              MUNDIAL
            </span>
          </h2>

          <p className="mt-10 text-chalk-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Pronostica los <strong className="text-flame-500">72 partidos</strong>{" "}
            de la fase de grupos. Compite con tus amigos.
            <br />
            <span className="font-display text-2xl sm:text-3xl text-paper-50 mt-2 inline-block">
              GANA EL MEJOR.
            </span>
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {session ? (
              <>
                <Link href="/predictions" className="btn-primary">
                  Mis Pronósticos →
                </Link>
                <Link href="/leaderboard" className="btn-secondary">
                  Clasificación
                </Link>
              </>
            ) : (
              <Link href="/login" className="btn-primary">
                Entrar →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats — cromos coloreados rotados */}
      <section className="mt-24 sm:mt-32 grid grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto">
        <StatCromo label="Partidos" value={total.toString()} accent="mustard" rotate="-rotate-2" />
        <StatCromo label="Grupos" value="12" accent="brick" rotate="rotate-1" />
        <StatCromo label="Selecciones" value="48" accent="grass" rotate="-rotate-1" />
      </section>

      {/* Reglas */}
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
          ⏰ Pronósticos cerrados al pitido inicial
        </p>
      </section>
    </div>
  );
}

function StatCromo({
  label,
  value,
  accent,
  rotate,
}: {
  label: string;
  value: string;
  accent: "mustard" | "brick" | "grass";
  rotate: string;
}) {
  const styles = {
    mustard: "bg-flame-500 text-pitch-950",
    brick: "bg-brick-500 text-paper-50",
    grass: "bg-grass-500 text-paper-50",
  };
  return (
    <div
      className={`cromo ${styles[accent]} ${rotate} p-4 sm:p-6 hover:rotate-0 hover:-translate-y-1 transition-all`}
    >
      <div className="font-display text-5xl sm:text-7xl leading-none">
        {value}
      </div>
      <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest mt-2 opacity-80">
        {label}
      </div>
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
