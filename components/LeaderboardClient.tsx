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
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (rows === null) {
    return (
      <div className="text-center py-16 text-chalk-400 font-mono text-sm uppercase tracking-widest animate-pulse">
        Cargando…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="cromo bg-paper-50 text-pitch-950 max-w-xl mx-auto p-8 text-center">
        <p className="font-display text-2xl mb-2">¡SIN PARTICIPANTES!</p>
        <p className="text-pitch-700">
          Pídele al organizador que añada gente desde el panel admin.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 mb-6 font-semibold text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Podio */}
      {rows.length >= 3 && rows[0].played > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-12 sm:mb-16 items-end px-2">
          <PodiumCard row={rows[1]} place={2} />
          <PodiumCard row={rows[0]} place={1} />
          <PodiumCard row={rows[2]} place={3} />
        </div>
      )}

      {/* Lista — cromos apilados */}
      <div className="space-y-3 sm:space-y-4">
        {rows.map((row) => {
          const isMe = row.name === currentName;
          const tone = isMe
            ? "bg-flame-500 text-pitch-950"
            : "bg-pitch-900 text-chalk-50";
          const accentTotal = isMe ? "text-pitch-950" : "text-flame-500";
          const accentPos = isMe ? "text-pitch-950" : "text-flame-500";
          return (
            <div
              key={row.name}
              className={`cromo ${tone} flex items-center gap-3 sm:gap-5 p-4 sm:p-5`}
            >
              <div
                className={`font-display text-4xl sm:text-6xl w-12 sm:w-20 leading-none text-center ${accentPos}`}
              >
                {row.position}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl sm:text-2xl tracking-tight truncate uppercase">
                  {row.name}
                  {isMe && (
                    <span className="ml-3 text-[10px] font-mono uppercase tracking-widest opacity-80">
                      ← TÚ
                    </span>
                  )}
                </div>
                <div className="flex gap-3 sm:gap-4 mt-1 text-[10px] font-mono uppercase tracking-widest opacity-80">
                  <span>
                    <strong className={isMe ? "text-pitch-950" : "text-grass-400"}>
                      {row.exact}
                    </strong>{" "}
                    ex
                  </span>
                  <span>
                    <strong className={isMe ? "text-pitch-950" : "text-flame-400"}>
                      {row.outcome}
                    </strong>{" "}
                    sg
                  </span>
                  <span>
                    <strong>{row.miss}</strong> fa
                  </span>
                  <span className="hidden sm:inline">· {row.played} jug.</span>
                </div>
              </div>
              <div
                className={`font-display text-4xl sm:text-5xl ${accentTotal} flex items-baseline gap-1`}
              >
                {row.total}
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                  pts
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {updatedAt && (
        <p className="mt-10 text-center font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
          Actualizado {updatedAt.toLocaleTimeString("es-ES")} · Auto-refresh 30s
        </p>
      )}
    </>
  );
}

function PodiumCard({ row, place }: { row: Row; place: 1 | 2 | 3 }) {
  const styles = {
    1: {
      h: "h-56 sm:h-72",
      bg: "bg-flame-500",
      text: "text-pitch-950",
      medal: "🥇",
      rotate: "rotate-1",
    },
    2: {
      h: "h-48 sm:h-60",
      bg: "bg-paper-100",
      text: "text-pitch-950",
      medal: "🥈",
      rotate: "-rotate-2",
    },
    3: {
      h: "h-44 sm:h-52",
      bg: "bg-brick-500",
      text: "text-paper-50",
      medal: "🥉",
      rotate: "rotate-1",
    },
  } as const;
  const s = styles[place];
  return (
    <div className={`flex flex-col items-stretch ${s.rotate} hover:rotate-0 transition-transform`}>
      <div className="text-center text-3xl sm:text-5xl mb-2">{s.medal}</div>
      <div
        className={`cromo ${s.h} ${s.bg} ${s.text} flex flex-col items-center justify-end p-3 sm:p-4`}
      >
        <div className="font-display text-5xl sm:text-7xl leading-none">
          {row.total}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest opacity-70 mt-1">
          puntos
        </div>
        <div className="font-display text-sm sm:text-lg mt-3 text-center leading-tight tracking-tight uppercase break-words">
          {row.name}
        </div>
      </div>
    </div>
  );
}
