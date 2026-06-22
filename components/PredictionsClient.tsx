"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TeamBadge from "@/components/TeamBadge";
import { useI18n } from "@/providers/I18nProvider";
import { phaseKeyFor } from "@/lib/knockout-phases";

type MatchRow = {
  id: number;
  matchNumber: number;
  matchDate: string | null;
  matchTime: string | null;
  kickoffAt: string;
  groupName: string | null;
  homeTeam: string;
  awayTeam: string;
  homeCode: string | null;
  awayCode: string | null;
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
  teamLogos,
  tournamentStartIso,
  tournamentStartLabel,
  phaseStarts = {},
  predictionLockMode = "per-match",
  lockMinutesBefore = 0,
}: {
  groupSlug: string;
  matches: MatchRow[];
  initialPreds: PredMap;
  teamLogos: Record<string, string>;
  tournamentStartIso: string;
  tournamentStartLabel: string;
  phaseStarts?: Record<string, { iso: string; label: string }>;
  predictionLockMode?: string;
  lockMinutesBefore?: number;
}) {
  const { t } = useI18n();
  const [preds, setPreds] = useState<PredMap>(initialPreds);
  const [filter, setFilter] = useState<Filter>("all");
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);
  const [savedFlash, setSavedFlash] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const debouncers = useRef<Record<number, NodeJS.Timeout>>({});
  // Valores validados pendientes de guardar (para poder flushear en onBlur
  // antes de que el debounce dispare, evitando perderlos al navegar).
  const pendingValues = useRef<Record<number, { homeScore: number; awayScore: number }>>({});

  const now = Date.now();
  const tournamentStartMs = new Date(tournamentStartIso).getTime();

  // En tournament-start, cada fase (grupos, dieciseisavos, octavos...) se
  // cierra con su propio primer kickoff en vez de con el del torneo entero
  // — así se puede seguir prediciendo la eliminatoria aunque la fase de
  // grupos lleve semanas cerrada. Ver lib/knockout-phases.ts.
  function phaseStartMsFor(groupName: string | null): number | null {
    const entry = phaseStarts[phaseKeyFor(groupName)];
    return entry ? new Date(entry.iso).getTime() : null;
  }

  function isMatchLocked(match: MatchRow): boolean {
    if (predictionLockMode === "tournament-start") {
      const threshold = phaseStartMsFor(match.groupName);
      if (threshold == null) return false;
      return now >= threshold;
    }
    const cutoff = new Date(match.kickoffAt).getTime() - Math.max(0, lockMinutesBefore) * 60_000;
    return now >= cutoff;
  }

  // true solo cuando ya no queda ningún partido abierto en ninguna fase.
  const tournamentLocked = matches.every((m) => isMatchLocked(m));

  // Días estables (sin aplicar el filtro pending) para que las flechas del
  // carousel no salten de jornada al ir rellenando predicciones.
  const dayGroups = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const m of matches) {
      const key = m.matchDate ?? "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [matches]);

  // Por defecto mostramos el primer día que aún tenga algún partido sin
  // empezar; si el torneo ya terminó, el último día.
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const idx = dayGroups.findIndex(([, ms]) =>
      ms.some((m) => new Date(m.kickoffAt).getTime() >= now)
    );
    return idx === -1 ? Math.max(0, dayGroups.length - 1) : idx;
  });

  const selectedDay = dayGroups[selectedDayIndex];

  // Etiqueta del corte relevante para lo que se está viendo ahora mismo
  // (puede ser el de fase de grupos o el de la ronda de eliminatoria de
  // turno, según qué jornada esté seleccionada).
  const selectedPhaseLabel = useMemo(() => {
    const groupName = selectedDay?.[1]?.[0]?.groupName ?? null;
    return phaseStarts[phaseKeyFor(groupName)]?.label ?? tournamentStartLabel;
  }, [selectedDay, phaseStarts, tournamentStartLabel]);

  const matchesOfSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    const [, ms] = selectedDay;
    if (filter === "pending") {
      return ms.filter((m) => !isMatchLocked(m) && preds[m.id] === undefined);
    }
    return ms;
  }, [selectedDay, filter, preds, tournamentLocked]);

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
        pendingValues.current[matchId] = { homeScore: next.homeScore, awayScore: next.awayScore };
        if (debouncers.current[matchId]) {
          clearTimeout(debouncers.current[matchId]);
        }
        debouncers.current[matchId] = setTimeout(() => {
          savePrediction(matchId, next.homeScore, next.awayScore);
          delete pendingValues.current[matchId];
        }, 600);
      } else {
        delete pendingValues.current[matchId];
      }

      return newPreds;
    });
  }

  // Llama al guardar inmediatamente cancelando el debounce pendiente.
  // Se dispara en onBlur de los inputs para evitar perder el valor al navegar.
  function flushPrediction(matchId: number) {
    if (debouncers.current[matchId]) {
      clearTimeout(debouncers.current[matchId]);
      delete debouncers.current[matchId];
    }
    const pending = pendingValues.current[matchId];
    if (pending) {
      savePrediction(matchId, pending.homeScore, pending.awayScore);
      delete pendingValues.current[matchId];
    }
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
        setErrorMsg(d.error || t.predictions.errorSaving);
        return;
      }
      setSavedFlash(matchId);
      setTimeout(() => setSavedFlash(null), 1200);
    } catch {
      setErrorMsg(t.common.noConnection);
    } finally {
      setSavingMatchId(null);
    }
  }

  return (
    <div>
      {/* Banner de cierre */}
      {tournamentLocked ? (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 mb-6 font-mono text-[11px] uppercase tracking-widest">
          {t.predictions.locked}
        </div>
      ) : predictionLockMode === "tournament-start" ? (
        <div className="cromo bg-paper-100 dark:bg-pitch-900 text-pitch-700 dark:text-chalk-300 px-4 py-3 mb-6 font-mono text-[11px] uppercase tracking-widest">
          {t.predictions.closesWithTournament.replace("{label}", selectedPhaseLabel)}
        </div>
      ) : (
        <div className="cromo bg-paper-100 dark:bg-pitch-900 text-pitch-700 dark:text-chalk-300 px-4 py-3 mb-6 font-mono text-[11px] uppercase tracking-widest">
          {t.predictions.closesPerMatch}
        </div>
      )}

      {/* Stats + filtros */}
      <div className="cromo bg-paper-50 dark:bg-pitch-900 p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex gap-8">
          <div>
            <div className="font-display text-5xl text-pitch-700 dark:text-flame-500 leading-none">
              {stats.filled}
              <span className="text-pitch-500 dark:text-chalk-400 text-3xl">/{stats.total}</span>
            </div>
            <div className="font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest mt-2">
              {t.predictions.predicted}
            </div>
          </div>
          <div>
            <div className="font-display text-5xl text-brick-400 leading-none">
              {stats.missing}
            </div>
            <div className="font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest mt-2">
              {t.predictions.missing}
            </div>
          </div>
        </div>

        {!tournamentLocked && (
          <div className="flex gap-2 text-xs flex-wrap">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              {t.predictions.all}
            </FilterChip>
            <FilterChip
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
            >
              {t.predictions.pending}
            </FilterChip>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 mb-4 sticky top-20 z-20 font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Carousel de día: flechas a los lados, fecha en medio */}
      {dayGroups.length > 0 && (
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8">
          <button
            type="button"
            onClick={() => setSelectedDayIndex((i) => Math.max(0, i - 1))}
            disabled={selectedDayIndex === 0}
            aria-label={t.predictions.prevDay}
            className="shrink-0 p-2 sm:p-2.5 border-2 border-pitch-950 bg-paper-50 text-pitch-950 shadow-brutal-sm disabled:opacity-30 disabled:shadow-none hover:bg-paper-100 transition-all enabled:hover:-translate-x-0.5"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center min-w-0">
            <span className="bg-flame-500 text-pitch-950 font-display text-lg sm:text-xl px-4 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block text-center">
              {selectedDay?.[0] ?? "—"}
            </span>
            <span className="mt-2 font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
              {t.predictions.dayCounter
                .replace("{current}", String(selectedDayIndex + 1))
                .replace("{total}", String(dayGroups.length))}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              setSelectedDayIndex((i) => Math.min(dayGroups.length - 1, i + 1))
            }
            disabled={selectedDayIndex === dayGroups.length - 1}
            aria-label={t.predictions.nextDay}
            className="shrink-0 p-2 sm:p-2.5 border-2 border-pitch-950 bg-paper-50 text-pitch-950 shadow-brutal-sm disabled:opacity-30 disabled:shadow-none hover:bg-paper-100 transition-all enabled:hover:translate-x-0.5"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <div>
        {matchesOfSelectedDay.length === 0 && (
          <div className="text-center py-16 text-pitch-500 dark:text-chalk-400 font-mono uppercase tracking-widest text-sm">
            {t.predictions.noMatchesInView}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 px-1 py-2">
          {matchesOfSelectedDay.map((m, idx) => (
            <MatchCard
              key={m.id}
              match={m}
              groupSlug={groupSlug}
              pred={preds[m.id]}
              onUpdate={updateLocal}
              onFlush={flushPrediction}
              saving={savingMatchId === m.id}
              saved={savedFlash === m.id}
              locked={isMatchLocked(m)}
              tilt={idx % 2 === 0 ? "even" : "odd"}
              homeLogoUrl={m.homeCode ? teamLogos[m.homeCode] ?? null : null}
              awayLogoUrl={m.awayCode ? teamLogos[m.awayCode] ?? null : null}
              labelSaving={t.predictions.saving}
              labelSaved={t.predictions.saved}
              labelLocked={t.predictions.locked_badge}
              labelExact={t.predictions.exactBadge}
              labelSign={t.predictions.signBadge}
              labelRealResult={t.predictions.realResult}
              labelMatchDetail={t.predictions.matchDetail}
              labelGoalsHome={t.predictions.goalsLabel.replace("{team}", m.homeTeam)}
              labelGoalsAway={t.predictions.goalsLabel.replace("{team}", m.awayTeam)}
              labelGroup={t.predictions.group}
            />
          ))}
        </div>
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
  groupSlug,
  pred,
  onUpdate,
  onFlush,
  saving,
  saved,
  locked,
  tilt,
  homeLogoUrl,
  awayLogoUrl,
  labelSaving,
  labelSaved,
  labelLocked,
  labelExact,
  labelSign,
  labelRealResult,
  labelMatchDetail,
  labelGoalsHome,
  labelGoalsAway,
  labelGroup,
}: {
  match: MatchRow;
  groupSlug: string;
  pred: { homeScore: number; awayScore: number } | undefined;
  onUpdate: (id: number, side: "home" | "away", value: string) => void;
  onFlush: (id: number) => void;
  saving: boolean;
  saved: boolean;
  locked: boolean;
  tilt: "even" | "odd";
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  labelSaving: string;
  labelSaved: string;
  labelLocked: string;
  labelExact: string;
  labelSign: string;
  labelRealResult: string;
  labelMatchDetail: string;
  labelGoalsHome: string;
  labelGoalsAway: string;
  labelGroup: string;
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
          {labelExact}
        </span>
      );
    } else {
      const ps = Math.sign(pred.homeScore - pred.awayScore);
      const rs = Math.sign(match.homeScore! - match.awayScore!);
      if (ps === rs) {
        cromoBg = "bg-flame-300";
        pointsBadge = (
          <span className="font-display text-[10px] bg-flame-500 text-pitch-950 px-2 py-1 border-2 border-pitch-950 shadow-brutal-sm tracking-wider">
            {labelSign}
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
              className={`group-${match.groupName} text-[10px] px-2 py-0.5 rounded-sm`}
            >
              {labelGroup.replace("{name}", match.groupName)}
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
              {labelSaving}
            </span>
          )}
          {saved && (
            <span className="font-mono text-[10px] text-grass-600 font-bold uppercase tracking-wider">
              {labelSaved}
            </span>
          )}
          {pointsBadge}
          {locked && !hasResult && (
            <span className="font-display text-[10px] bg-pitch-950 text-flame-400 px-2 py-1 border-2 border-pitch-950 tracking-wider">
              {labelLocked}
            </span>
          )}
        </div>
      </div>

      {/* Selecciones + score.
          minmax(0,1fr) en cols laterales: permite encogerse hasta 0 para
          que los nombres largos truncan/wrapean en vez de empujar el grid.
          min-h en el bloque del nombre: reserva siempre el alto de 2 líneas
          para que home y away queden simétricos aunque uno wrapee y otro no. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-3 items-center">
        <div className="text-right min-w-0">
          <div className="flex justify-end mb-1">
            <TeamBadge
              code={match.homeCode}
              flag={match.homeFlag}
              logoUrl={homeLogoUrl}
              alt={match.homeTeam}
              size="md"
            />
          </div>
          <div className="font-display uppercase text-pitch-950 text-xs sm:text-sm leading-tight tracking-tight text-balance min-h-[2.5em] flex items-start justify-end">
            {match.homeTeam}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={pred && pred.homeScore >= 0 ? pred.homeScore : ""}
            onChange={(e) => onUpdate(match.id, "home", e.target.value)}
            onBlur={() => onFlush(match.id)}
            disabled={locked}
            className="score-input"
            aria-label={labelGoalsHome}
          />
          <span className="text-pitch-950 font-display text-3xl">·</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={pred && pred.awayScore >= 0 ? pred.awayScore : ""}
            onChange={(e) => onUpdate(match.id, "away", e.target.value)}
            onBlur={() => onFlush(match.id)}
            disabled={locked}
            className="score-input"
            aria-label={labelGoalsAway}
          />
        </div>

        <div className="text-left min-w-0">
          <div className="flex justify-start mb-1">
            <TeamBadge
              code={match.awayCode}
              flag={match.awayFlag}
              logoUrl={awayLogoUrl}
              alt={match.awayTeam}
              size="md"
            />
          </div>
          <div className="font-display uppercase text-pitch-950 text-xs sm:text-sm leading-tight tracking-tight text-balance min-h-[2.5em] flex items-start">
            {match.awayTeam}
          </div>
        </div>
      </div>

      {/* Resultado real */}
      {hasResult && (
        <div className="mt-4 pt-3 border-t-2 border-dashed border-pitch-950/30 text-center">
          <span className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest">
            {labelRealResult}
          </span>
          <div className="font-display text-3xl text-pitch-950 mt-1">
            {match.homeScore} <span className="text-brick-500">·</span>{" "}
            {match.awayScore}
          </div>
        </div>
      )}

      <div className="mt-3 text-right">
        <Link
          href={`/g/${groupSlug}/m/${match.matchNumber}`}
          className="inline-block font-mono text-[10px] uppercase tracking-widest text-pitch-700 hover:text-flame-600 whitespace-nowrap"
        >
          {labelMatchDetail}
        </Link>
      </div>
    </article>
  );
}
