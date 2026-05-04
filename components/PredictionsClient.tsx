"use client";

import { useState, useMemo, useRef } from "react";

type MatchRow = {
  id: number;
  matchNumber: number;
  matchDate: string;
  matchTime: string;
  kickoffAt: string;
  groupName: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  stadium: string;
  homeScore: number | null;
  awayScore: number | null;
};

type PredMap = Record<number, { homeScore: number; awayScore: number }>;

type Filter = "all" | "pending" | "locked";

export default function PredictionsClient({
  matches,
  initialPreds,
}: {
  matches: MatchRow[];
  initialPreds: PredMap;
}) {
  const [preds, setPreds] = useState<PredMap>(initialPreds);
  const [filter, setFilter] = useState<Filter>("all");
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debouncers = useRef<Record<number, NodeJS.Timeout>>({});

  const now = Date.now();

  const grouped = useMemo(() => {
    const visible = matches.filter((m) => {
      const locked = new Date(m.kickoffAt).getTime() <= now;
      if (filter === "pending") return !locked && preds[m.id] === undefined;
      if (filter === "locked") return locked;
      return true;
    });

    const map = new Map<string, MatchRow[]>();
    for (const m of visible) {
      const key = m.matchDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [matches, filter, preds, now]);

  const stats = useMemo(() => {
    const filledCount = matches.filter((m) => preds[m.id] !== undefined).length;
    const lockedCount = matches.filter(
      (m) => new Date(m.kickoffAt).getTime() <= now
    ).length;
    return {
      filled: filledCount,
      total: matches.length,
      locked: lockedCount,
    };
  }, [matches, preds, now]);

  function updateLocal(matchId: number, side: "home" | "away", value: string) {
    const num = value === "" ? null : parseInt(value, 10);
    setPreds((prev) => {
      const current = prev[matchId] || { homeScore: 0, awayScore: 0 };
      const next = {
        homeScore: side === "home" ? num ?? -1 : current.homeScore,
        awayScore: side === "away" ? num ?? -1 : current.awayScore,
      };
      // Solo guardamos si ambos lados son válidos
      const isValid =
        Number.isInteger(next.homeScore) &&
        next.homeScore >= 0 &&
        Number.isInteger(next.awayScore) &&
        next.awayScore >= 0;

      const newPreds = { ...prev };
      if (isValid) {
        newPreds[matchId] = {
          homeScore: next.homeScore,
          awayScore: next.awayScore,
        };
      } else {
        // Mantenemos parcial en estado pero sin guardar
        newPreds[matchId] = {
          homeScore: next.homeScore < 0 ? -1 : next.homeScore,
          awayScore: next.awayScore < 0 ? -1 : next.awayScore,
        } as any;
      }

      // Programar guardado debounced
      if (isValid) {
        if (debouncers.current[matchId]) {
          clearTimeout(debouncers.current[matchId]);
        }
        debouncers.current[matchId] = setTimeout(() => {
          savePrediction(matchId, next.homeScore, next.awayScore);
        }, 600);
      }

      return newPreds;
    });
  }

  async function savePrediction(
    matchId: number,
    homeScore: number,
    awayScore: number
  ) {
    setSavingMatchId(matchId);
    setErrorMsg(null);
    try {
      const r = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeScore, awayScore }),
      });
      if (!r.ok) {
        const d = await r.json();
        setErrorMsg(d.error || "Error al guardar");
        return;
      }
      setSavedFlash(matchId);
      setTimeout(() => setSavedFlash(null), 1200);
    } catch {
      setErrorMsg("Sin conexión");
    } finally {
      setSavingMatchId(null);
    }
  }

  return (
    <div>
      {/* Stats + filtros */}
      <div className="bg-pitch-900/60 border border-pitch-800 rounded-2xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-6">
          <div>
            <div className="font-display text-4xl text-chalk-50 leading-none">
              {stats.filled}
              <span className="text-chalk-400">/{stats.total}</span>
            </div>
            <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest mt-1">
              Pronosticados
            </div>
          </div>
          <div>
            <div className="font-display text-4xl text-flame-500 leading-none">
              {stats.locked}
            </div>
            <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest mt-1">
              Bloqueados
            </div>
          </div>
        </div>

        <div className="flex gap-2 text-xs flex-wrap">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Todos
          </FilterChip>
          <FilterChip
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          >
            Pendientes
          </FilterChip>
          <FilterChip
            active={filter === "locked"}
            onClick={() => setFilter("locked")}
          >
            Bloqueados
          </FilterChip>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-900/40 border border-red-800 text-red-200 text-sm rounded-lg px-4 py-3 mb-4 sticky top-20 z-20">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="space-y-8">
        {grouped.length === 0 && (
          <div className="text-center py-16 text-chalk-400">
            No hay partidos en esta vista.
          </div>
        )}
        {grouped.map(([date, matchesOfDay]) => (
          <section key={date}>
            <h2 className="font-display text-2xl text-flame-400 mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-pitch-800" />
              <span>{date.toUpperCase()}</span>
              <span className="h-px flex-1 bg-pitch-800" />
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {matchesOfDay.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  pred={preds[m.id]}
                  onUpdate={updateLocal}
                  saving={savingMatchId === m.id}
                  saved={savedFlash === m.id}
                  now={now}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg uppercase tracking-wider font-mono font-semibold transition-all ${
        active
          ? "bg-flame-500 text-pitch-950"
          : "bg-pitch-800 text-chalk-200 hover:bg-pitch-700"
      }`}
    >
      {children}
    </button>
  );
}

function MatchCard({
  match,
  pred,
  onUpdate,
  saving,
  saved,
  now,
}: {
  match: MatchRow;
  pred: { homeScore: number; awayScore: number } | undefined;
  onUpdate: (id: number, side: "home" | "away", value: string) => void;
  saving: boolean;
  saved: boolean;
  now: number;
}) {
  const kickoff = new Date(match.kickoffAt).getTime();
  const locked = kickoff <= now;
  const hasResult = match.homeScore != null && match.awayScore != null;

  let resultClass = "";
  let pointsBadge = null;
  if (hasResult && pred && pred.homeScore >= 0 && pred.awayScore >= 0) {
    if (
      pred.homeScore === match.homeScore &&
      pred.awayScore === match.awayScore
    ) {
      resultClass = "border-grass-500/60 bg-grass-500/5";
      pointsBadge = (
        <span className="font-mono text-xs bg-grass-500 text-pitch-950 px-2 py-0.5 rounded font-bold">
          +3 EXACTO
        </span>
      );
    } else {
      const ps = Math.sign(pred.homeScore - pred.awayScore);
      const rs = Math.sign(match.homeScore! - match.awayScore!);
      if (ps === rs) {
        resultClass = "border-flame-500/40 bg-flame-500/5";
        pointsBadge = (
          <span className="font-mono text-xs bg-flame-500 text-pitch-950 px-2 py-0.5 rounded font-bold">
            +1 SIGNO
          </span>
        );
      } else {
        resultClass = "border-pitch-700 opacity-70";
        pointsBadge = (
          <span className="font-mono text-xs bg-pitch-800 text-chalk-400 px-2 py-0.5 rounded">
            +0
          </span>
        );
      }
    }
  }

  return (
    <article
      className={`bg-pitch-900/60 border-2 border-pitch-800 rounded-xl p-4 transition-all ${resultClass}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`group-${match.groupName} text-[10px] font-bold px-2 py-0.5 rounded font-mono`}
          >
            GRUPO {match.groupName}
          </span>
          <span className="font-mono text-xs text-chalk-400">
            {match.matchTime}
          </span>
          <span className="font-mono text-xs text-chalk-400 hidden sm:inline">
            · {match.stadium}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="font-mono text-[10px] text-chalk-400 animate-pulse">
              guardando...
            </span>
          )}
          {saved && (
            <span className="font-mono text-[10px] text-grass-400">
              ✓ guardado
            </span>
          )}
          {pointsBadge}
          {locked && !hasResult && (
            <span className="font-mono text-[10px] text-flame-400 uppercase">
              🔒 bloqueado
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div className="text-right">
          <div className="text-2xl mb-0.5">{match.homeFlag}</div>
          <div className="font-bold text-chalk-50 text-sm sm:text-base leading-tight">
            {match.homeTeam}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={pred && pred.homeScore >= 0 ? pred.homeScore : ""}
            onChange={(e) => onUpdate(match.id, "home", e.target.value)}
            disabled={locked}
            className="score-input"
            aria-label={`Goles ${match.homeTeam}`}
          />
          <span className="text-chalk-400 font-display text-2xl">·</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={pred && pred.awayScore >= 0 ? pred.awayScore : ""}
            onChange={(e) => onUpdate(match.id, "away", e.target.value)}
            disabled={locked}
            className="score-input"
            aria-label={`Goles ${match.awayTeam}`}
          />
        </div>

        <div className="text-left">
          <div className="text-2xl mb-0.5">{match.awayFlag}</div>
          <div className="font-bold text-chalk-50 text-sm sm:text-base leading-tight">
            {match.awayTeam}
          </div>
        </div>
      </div>

      {hasResult && (
        <div className="mt-3 pt-3 border-t border-pitch-800 text-center">
          <span className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
            Resultado real
          </span>
          <div className="font-display text-2xl text-chalk-50 mt-0.5">
            {match.homeScore} – {match.awayScore}
          </div>
        </div>
      )}
    </article>
  );
}
