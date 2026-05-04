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
    <div className="pt-12 sm:pt-20">
      <div className="text-center max-w-3xl mx-auto">
        <p className="font-mono text-xs text-flame-400 uppercase tracking-[0.3em] mb-4">
          Junio 2026 · Norteamérica
        </p>
        <h1 className="font-display text-6xl sm:text-8xl text-chalk-50 leading-[0.9] mb-6">
          La Porra
          <br />
          <span className="text-flame-500">del Mundial</span>
        </h1>
        <p className="text-chalk-200 text-lg sm:text-xl max-w-xl mx-auto mb-10">
          Pronostica los 72 partidos de la fase de grupos. Compite con tus
          amigos. Gana el mejor.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {session ? (
            <>
              <Link href="/predictions" className="btn-primary">
                Mis Pronósticos
              </Link>
              <Link href="/leaderboard" className="btn-secondary">
                Ver Clasificación
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              Entrar
            </Link>
          )}
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Stat label="Partidos" value={total.toString()} accent="grass" />
        <Stat label="Grupos" value="12" accent="flame" />
        <Stat label="Selecciones" value="48" accent="chalk" />
      </div>

      <div className="mt-16 max-w-3xl mx-auto bg-pitch-900/60 border border-pitch-800 rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-3xl text-chalk-50 mb-4 flex items-center gap-3">
          <span className="text-flame-500">📐</span> Reglas
        </h2>
        <ul className="space-y-3 text-chalk-200">
          <li className="flex gap-3">
            <span className="font-display text-3xl text-grass-400 leading-none">
              3
            </span>
            <div>
              <strong className="text-chalk-50">Resultado exacto.</strong>{" "}
              Predices 2-1 y queda 2-1.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-display text-3xl text-flame-400 leading-none">
              1
            </span>
            <div>
              <strong className="text-chalk-50">Acierto del signo.</strong>{" "}
              Aciertas el ganador (o el empate) pero no el resultado exacto.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-display text-3xl text-chalk-400 leading-none">
              0
            </span>
            <div>
              <strong className="text-chalk-50">Fallo.</strong> Ni resultado ni
              signo.
            </div>
          </li>
        </ul>
        <p className="mt-6 pt-6 border-t border-pitch-800 text-sm text-chalk-400">
          ⏰ Los pronósticos se cierran automáticamente al pitido inicial de
          cada partido.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "grass" | "flame" | "chalk";
}) {
  const colorMap = {
    grass: "text-grass-400 border-grass-500/30",
    flame: "text-flame-500 border-flame-500/30",
    chalk: "text-chalk-50 border-chalk-200/30",
  };
  return (
    <div className={`bg-pitch-900/50 border rounded-xl p-6 ${colorMap[accent]}`}>
      <div className="font-display text-5xl mb-1">{value}</div>
      <div className="font-mono text-xs uppercase tracking-widest text-chalk-400">
        {label}
      </div>
    </div>
  );
}
