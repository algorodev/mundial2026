"use client";

import { useState, useMemo, useRef } from "react";

type MatchRow = {
  id: number;
  matchNumber: number;
  matchDate: string | null;
  matchTime: string | null;
  kickoffAt: string;
  groupName: string | null;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string | null;
  awayFlag: string | null;
  stadium: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

type PredMap = Record<number, { homeScore: number; awayScore: number }>;

type Filter = "all" | "pending";

export default function PredictionsClient({
  groupSlug,
  matches,
  initialPreds,
  tournamentStartIso,
  tournamentStartLabel,
}: {
  groupSlug: string;
  matches: MatchRow[];
  initialPreds: PredMap;
  tournamentStartIso: string;
  tournamentStartLabel: string;
}) {
  const [preds, setPreds] = useState<PredMap>(initialPreds);
  const [filter, setFilter] = useState<Filter>("all");
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debouncers = useRef<Record<number, NodeJS.Timeout>>({});

  const now = Date.now();
  // Cierre global: con el pitido del primer partido todas las predicciones quedan bloqueadas.
  const tournamentLocked = now >= new Date(tournamentStartIso).getTime();

  const grouped = useMemo(() => {
    const visible = matches.filter((m) => {
      if (filter === "pending") return !tournamentLocked && preds[m.id] === undefined;
      return true;
    });

    const map = new Map<string, MatchRow[]>();
    for (const m of visible) {
      const key = m.matchDate ?? "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [matches, filter, preds, tournamentLocked]);

  const stats = useMemo(() => {
    const filledCount = matches.filter((m) => preds[m.id] !== undefined).length;
    return {
      filled: filledCount,
      total: matches.length,
      missing: matches.length - filledCount,
    };
  }, [matches, preds]);

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
        body: JSON.stringify({ groupSlug, matchId, homeScore, awayScore }),
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
      {/* Banner de cierre del torneo */}
      {tournamentLocked ? (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 mb-6 font-mono text-[11px] uppercase tracking-widest">
          🔒 El torneo ha empezado · Las predicciones están cerradas
        </div>
      ) : (
        <div className="cromo bg-pitch-900 text-chalk-300 px-4 py-3 mb-6 font-mono text-[11px] uppercase tracking-widest">
          ⏱ Cierre con el primer partido · {tournamentStartLabel}
        </div>
      )}

      {/* Stats + filtros */}
      <div className="cromo bg-pitch-900 p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex gap-8">
          <div>
            <div className="font-display text-5xl text-flame-500 leading-none">
              {stats.filled}
              <span className="text-chalk-400 text-3xl">/{stats.total}</span>
            </div>
            <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest mt-2">
              Pronosticados
            </div>
          </div>
          <div>
            <div className="font-display text-5xl text-brick-400 leading-none">
              {stats.missing}
            </div>
            <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest mt-2">
              Sin rellenar
            </div>
          </div>
        </div>

        {!tournamentLocked && (
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
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 mb-4 sticky top-20 z-20 font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="space-y-12">
        {grouped.length === 0 && (
          <div className="text-center py-16 text-chalk-400 font-mono uppercase tracking-widest text-sm">
            No hay partidos en esta vista.
          </div>
        )}
        {grouped.map(([date, matchesOfDay]) => (
          <section key={date}>
            <h2 className="mb-5 flex items-center gap-3">
              <span className="h-1 flex-1 bg-pitch-800" />
              <span className="bg-flame-500 text-pitch-950 font-display text-xl px-4 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
                {date}
              </span>
              <span className="h-1 flex-1 bg-pitch-800" />
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 px-1 py-2">
              {matchesOfDay.map((m, idx) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  pred={preds[m.id]}
                  onUpdate={updateLocal}
                  saving={savingMatchId === m.id}
                  saved={savedFlash === m.id}
                  locked={tournamentLocked}
                  tilt={idx % 2 === 0 ? "even" : "odd"}
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
      className={`px-4 py-2 rounded uppercase tracking-wider font-display text-xs border-2 border-pitch-950 transition-all ${
        active
          ? "bg-flame-500 text-pitch-950 shadow-brutal-sm -translate-x-0.5 -translate-y-0.5"
          : "bg-paper-50 text-pitch-950 hover:bg-paper-100"
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
  locked,
  tilt,
}: {
  match: MatchRow;
  pred: { homeScore: number; awayScore: number } | undefined;
  onUpdate: (id: number, side: "home" | "away", value: string) => void;
  saving: boolean;
  saved: boolean;
  locked: boolean;
  tilt: "even" | "odd";
}) {
  const hasResult = match.homeScore != null && match.awayScore != null;

  // Tinte del cromo según resultado
  let cromoBg = "bg-paper-50";
  let pointsBadge: React.ReactNode = null;
  if (hasResult && pred && pred.homeScore >= 0 && pred.awayScore >= 0) {
    if (
      pred.homeScore === match.homeScore &&
      pred.awayScore === match.awayScore
    ) {
      cromoBg = "bg-grass-300";
      pointsBadge = (
        <span className="font-display text-[10px] bg-grass-600 text-paper-50 px-2 py-1 border-2 border-pitch-950 shadow-brutal-sm tracking-wider">
          +3 EXACTO
        </span>
      );
    } else {
      const ps = Math.sign(pred.homeScore - pred.awayScore);
      const rs = Math.sign(match.homeScore! - match.awayScore!);
      if (ps === rs) {
        cromoBg = "bg-flame-300";
        pointsBadge = (
          <span className="font-display text-[10px] bg-flame-500 text-pitch-950 px-2 py-1 border-2 border-pitch-950 shadow-brutal-sm tracking-wider">
            +1 SIGNO
          </span>
        );
      } else {
        cromoBg = "bg-paper-200";
        pointsBadge = (
          <span className="font-display text-[10px] bg-pitch-950 text-chalk-400 px-2 py-1 border-2 border-pitch-950 shadow-brutal-sm tracking-wider">
            +0
          </span>
        );
      }
    }
  }

  const tiltClass =
    tilt === "even" ? "rotate-[-0.4deg]" : "rotate-[0.4deg]";

  return (
    <article
      className={`cromo ${cromoBg} text-pitch-950 ${tiltClass} p-4 sm:p-5 hover:rotate-0 hover:-translate-y-1 hover:shadow-brutal-lg transition-all`}
    >
      {/* Header: grupo + hora · estado a la derecha */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {match.groupName && (
            <span
              className={`group-${match.groupName} text-[10px] px-2 py-0.5 rounded`}
            >
              GRUPO {match.groupName}
            </span>
          )}
          {match.matchTime && (
            <span className="font-mono text-xs text-pitch-700 font-bold">
              {match.matchTime}
            </span>
          )}
          {match.stadium && (
            <span className="font-mono text-[10px] text-pitch-700/60 hidden sm:inline">
              · {match.stadium}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && (
            <span className="font-mono text-[10px] text-pitch-700 animate-pulse uppercase tracking-wider">
              guardando…
            </span>
          )}
          {saved && (
            <span className="font-mono text-[10px] text-grass-600 font-bold uppercase tracking-wider">
              ✓ guardado
            </span>
          )}
          {pointsBadge}
          {locked && !hasResult && (
            <span className="font-display text-[10px] bg-pitch-950 text-flame-400 px-2 py-1 border-2 border-pitch-950 tracking-wider">
              🔒 BLOQUEADO
            </span>
          )}
        </div>
      </div>

      {/* Selecciones + score */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div className="text-right">
          <div className="text-3xl sm:text-4xl mb-1">{match.homeFlag}</div>
          <div className="font-display uppercase text-pitch-950 text-sm sm:text-base leading-tight tracking-tight">
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
          <span className="text-pitch-950 font-display text-3xl">·</span>
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
          <div className="text-3xl sm:text-4xl mb-1">{match.awayFlag}</div>
          <div className="font-display uppercase text-pitch-950 text-sm sm:text-base leading-tight tracking-tight">
            {match.awayTeam}
          </div>
        </div>
      </div>

      {/* Resultado real */}
      {hasResult && (
        <div className="mt-4 pt-3 border-t-2 border-dashed border-pitch-950/30 text-center">
          <span className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest">
            Resultado real
          </span>
          <div className="font-display text-3xl text-pitch-950 mt-1">
            {match.homeScore} <span className="text-brick-500">·</span>{" "}
            {match.awayScore}
          </div>
        </div>
      )}
    </article>
  );
}
