"use client";

import { useEffect, useState } from "react";

type Row = {
  position: number;
  name: string;
  total: number;
  exact: number;
  outcome: number;
  miss: number;
  played: number;
};

export default function LeaderboardClient({
  currentName,
}: {
  currentName: string;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!r.ok) throw new Error("err");
      const d = await r.json();
      setRows(d.leaderboard);
      setUpdatedAt(new Date());
      setError(null);
    } catch {
      setError("No se ha podido actualizar la clasificación");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000); // refresh cada 30s
    return () => clearInterval(interval);
  }, []);

  if (rows === null) {
    return (
      <div className="text-center py-16 text-chalk-400 font-mono text-sm uppercase tracking-widest">
        Cargando...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-chalk-400">
        Aún no hay participantes. Pídele al organizador que añada gente desde el
        panel admin.
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-red-900/40 border border-red-800 text-red-200 text-sm rounded-lg px-4 py-3 mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Podio para el top 3 */}
      {rows.length >= 3 && rows[0].played > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <PodiumCard row={rows[1]} place={2} />
          <PodiumCard row={rows[0]} place={1} />
          <PodiumCard row={rows[2]} place={3} />
        </div>
      )}

      <div className="bg-pitch-900/60 border border-pitch-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left bg-pitch-950 border-b border-pitch-800">
              <th className="font-mono text-[10px] uppercase tracking-widest text-chalk-400 px-4 py-3 w-12">
                #
              </th>
              <th className="font-mono text-[10px] uppercase tracking-widest text-chalk-400 px-4 py-3">
                Participante
              </th>
              <th className="font-mono text-[10px] uppercase tracking-widest text-grass-400 px-2 py-3 text-center hidden sm:table-cell">
                Exactos
              </th>
              <th className="font-mono text-[10px] uppercase tracking-widest text-flame-400 px-2 py-3 text-center hidden sm:table-cell">
                Signo
              </th>
              <th className="font-mono text-[10px] uppercase tracking-widest text-chalk-400 px-2 py-3 text-center hidden md:table-cell">
                Fallos
              </th>
              <th className="font-mono text-[10px] uppercase tracking-widest text-chalk-400 px-2 py-3 text-center">
                Jug.
              </th>
              <th className="font-mono text-[10px] uppercase tracking-widest text-flame-500 px-4 py-3 text-right">
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isMe = row.name === currentName;
              return (
                <tr
                  key={row.name}
                  className={`border-b border-pitch-800 last:border-0 transition-colors ${
                    isMe ? "bg-flame-500/10" : "hover:bg-pitch-800/40"
                  }`}
                >
                  <td className="px-4 py-3 font-display text-2xl text-chalk-50">
                    {row.position}
                  </td>
                  <td className="px-4 py-3 font-bold text-chalk-50">
                    {row.name}
                    {isMe && (
                      <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-flame-400">
                        ← tú
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center font-mono text-grass-400 hidden sm:table-cell">
                    {row.exact}
                  </td>
                  <td className="px-2 py-3 text-center font-mono text-flame-400 hidden sm:table-cell">
                    {row.outcome}
                  </td>
                  <td className="px-2 py-3 text-center font-mono text-chalk-400 hidden md:table-cell">
                    {row.miss}
                  </td>
                  <td className="px-2 py-3 text-center font-mono text-chalk-200">
                    {row.played}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-3xl text-flame-500">
                    {row.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {updatedAt && (
        <p className="mt-4 text-center font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
          Actualizado: {updatedAt.toLocaleTimeString("es-ES")} · Auto-refresh
          cada 30s
        </p>
      )}
    </>
  );
}

function PodiumCard({ row, place }: { row: Row; place: 1 | 2 | 3 }) {
  const styles = {
    1: {
      height: "h-44 sm:h-56",
      bg: "bg-flame-500",
      text: "text-pitch-950",
      medal: "🥇",
    },
    2: {
      height: "h-36 sm:h-48",
      bg: "bg-chalk-200",
      text: "text-pitch-950",
      medal: "🥈",
    },
    3: {
      height: "h-32 sm:h-40",
      bg: "bg-flame-600/80",
      text: "text-chalk-50",
      medal: "🥉",
    },
  } as const;
  const s = styles[place];
  return (
    <div className="flex flex-col justify-end">
      <div className={`text-center text-3xl mb-1`}>{s.medal}</div>
      <div
        className={`${s.height} ${s.bg} ${s.text} rounded-t-xl flex flex-col items-center justify-end p-3`}
      >
        <div className="font-display text-2xl sm:text-3xl">{row.total}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest opacity-70">
          puntos
        </div>
        <div className="font-bold text-sm sm:text-base mt-2 text-center leading-tight">
          {row.name}
        </div>
      </div>
    </div>
  );
}
