"use client";

import { useState, useMemo } from "react";
import TeamBadge from "@/components/TeamBadge";
import { useI18n } from "@/providers/I18nProvider";

type MatchRow = {
  id: number;
  tournamentId: number;
  matchNumber: number;
  matchDate: string | null;
  matchTime: string | null;
  kickoffAt: string;
  groupName: string | null;
  homeFrom: string | null;
  homeTeam: string;
  awayTeam: string;
  homeCode: string | null;
  awayCode: string | null;
  homeFlag: string | null;
  awayFlag: string | null;
  stadium: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreAet: number | null;
  awayScoreAet: number | null;
  penaltyHome: number | null;
  penaltyAway: number | null;
};

export default function AdminResultsClient({
  tournamentSlug,
  matches,
  teamLogos,
  knockoutScoring: initialKnockoutScoring,
}: {
  tournamentSlug: string;
  matches: MatchRow[];
  teamLogos: Record<string, string>;
  knockoutScoring: string;
}) {
  const { t } = useI18n();
  const [list, setList] = useState(matches);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [knockoutScoring, setKnockoutScoring] = useState(initialKnockoutScoring);
  const [savingSettings, setSavingSettings] = useState(false);

  const visible = useMemo(() => {
    return list.filter((m) => {
      if (filter === "pending") return m.homeScore == null;
      if (filter === "done") return m.homeScore != null;
      return true;
    });
  }, [list, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const m of visible) {
      const key = m.matchDate ?? "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [visible]);

  async function saveResult(
    id: number,
    homeScore: number | null,
    awayScore: number | null,
    homeScoreAet?: number | null,
    awayScoreAet?: number | null,
    penaltyHome?: number | null,
    penaltyAway?: number | null
  ) {
    setSavingId(id);
    try {
      const r = await fetch(`/api/admin/t/${tournamentSlug}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id, homeScore, awayScore, homeScoreAet, awayScoreAet, penaltyHome, penaltyAway }),
      });
      if (r.ok) {
        setList((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, homeScore, awayScore, homeScoreAet: homeScoreAet ?? null, awayScoreAet: awayScoreAet ?? null, penaltyHome: penaltyHome ?? null, penaltyAway: penaltyAway ?? null }
              : m
          )
        );
        setSavedId(id);
        setTimeout(() => setSavedId(null), 1200);
      }
    } finally {
      setSavingId(null);
    }
  }

  async function saveKnockoutScoring(value: string) {
    setSavingSettings(true);
    try {
      await fetch(`/api/admin/t/${tournamentSlug}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knockoutScoring: value }),
      });
      setKnockoutScoring(value);
    } finally {
      setSavingSettings(false);
    }
  }

  const pendingCount = list.filter((m) => m.homeScore == null).length;
  const doneCount = list.filter((m) => m.homeScore != null).length;

  return (
    <div>
      {/* Configuración eliminatorias */}
      <div className="cromo bg-paper-50 text-pitch-950 p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-display uppercase tracking-wider text-sm">{t.admin.knockoutScoringLabel}</p>
          <p className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest mt-1">{t.admin.knockoutScoringDesc}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => saveKnockoutScoring("fulltime")}
            disabled={savingSettings}
            className={`px-3 py-2 text-xs font-display uppercase tracking-wider border-2 border-pitch-950 transition-all ${
              knockoutScoring === "fulltime"
                ? "bg-flame-500 text-pitch-950 shadow-brutal-sm -translate-y-0.5"
                : "bg-paper-100 text-pitch-950 hover:bg-paper-200"
            }`}
          >
            {t.admin.knockoutFulltime}
          </button>
          <button
            onClick={() => saveKnockoutScoring("extended")}
            disabled={savingSettings}
            className={`px-3 py-2 text-xs font-display uppercase tracking-wider border-2 border-pitch-950 transition-all ${
              knockoutScoring === "extended"
                ? "bg-flame-500 text-pitch-950 shadow-brutal-sm -translate-y-0.5"
                : "bg-paper-100 text-pitch-950 hover:bg-paper-200"
            }`}
          >
            {t.admin.knockoutExtended}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          {t.admin.allFilterCount.replace("{count}", String(list.length))}
        </FilterChip>
        <FilterChip
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        >
          {t.admin.pendingFilterCount.replace("{count}", String(pendingCount))}
        </FilterChip>
        <FilterChip
          active={filter === "done"}
          onClick={() => setFilter("done")}
        >
          {t.admin.doneFilterCount.replace("{count}", String(doneCount))}
        </FilterChip>
      </div>

      <div className="space-y-8">
        {grouped.map(([date, items]) => (
          <section key={date}>
            <h3 className="mb-4 flex items-center gap-3">
              <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
              <span className="bg-flame-500 text-pitch-950 font-display text-lg px-4 py-1 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
                {date}
              </span>
              <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
            </h3>
            <div className="space-y-2 px-1">
              {items.map((m) => (
                <ResultRow
                  key={m.id}
                  match={m}
                  saving={savingId === m.id}
                  saved={savedId === m.id}
                  onSave={saveResult}
                  homeLogoUrl={m.homeCode ? teamLogos[m.homeCode] ?? null : null}
                  awayLogoUrl={m.awayCode ? teamLogos[m.awayCode] ?? null : null}
                  showExtended={knockoutScoring === "extended" && m.homeFrom != null}
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
      className={`px-3 py-2 rounded text-xs uppercase tracking-wider font-display border-2 border-pitch-950 transition-all ${
        active
          ? "bg-flame-500 text-pitch-950 shadow-brutal-sm -translate-y-0.5"
          : "bg-paper-50 text-pitch-950 hover:bg-paper-100"
      }`}
    >
      {children}
    </button>
  );
}

function ResultRow({
  match,
  saving,
  saved,
  onSave,
  homeLogoUrl,
  awayLogoUrl,
  showExtended,
}: {
  match: MatchRow;
  saving: boolean;
  saved: boolean;
  onSave: (id: number, h: number | null, a: number | null, hAet?: number | null, aAet?: number | null, pH?: number | null, pA?: number | null) => void;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  showExtended: boolean;
}) {
  const { t } = useI18n();
  const [home, setHome] = useState(match.homeScore != null ? String(match.homeScore) : "");
  const [away, setAway] = useState(match.awayScore != null ? String(match.awayScore) : "");
  const [homeAet, setHomeAet] = useState(match.homeScoreAet != null ? String(match.homeScoreAet) : "");
  const [awayAet, setAwayAet] = useState(match.awayScoreAet != null ? String(match.awayScoreAet) : "");
  const [penH, setPenH] = useState(match.penaltyHome != null ? String(match.penaltyHome) : "");
  const [penA, setPenA] = useState(match.penaltyAway != null ? String(match.penaltyAway) : "");

  function commit() {
    if (home === "" && away === "") {
      onSave(match.id, null, null);
      return;
    }
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) return;
    const hAet = homeAet !== "" ? parseInt(homeAet, 10) : null;
    const aAet = awayAet !== "" ? parseInt(awayAet, 10) : null;
    const pH = penH !== "" ? parseInt(penH, 10) : null;
    const pA = penA !== "" ? parseInt(penA, 10) : null;
    onSave(match.id, h, a, hAet, aAet, pH, pA);
  }

  const filled = match.homeScore != null;

  return (
    <div className={`cromo ${filled ? "bg-grass-300" : "bg-paper-50"} text-pitch-950 p-3 sm:p-4`}>
      <div className="flex items-center gap-3">
        {match.groupName && (
          <span className={`group-${match.groupName} text-[10px] px-2 py-0.5 rounded-sm shrink-0`}>
            {match.groupName}
          </span>
        )}
        {!match.groupName && match.homeFrom && (
          <span className="font-mono text-[10px] text-flame-600 uppercase tracking-wider shrink-0">KO</span>
        )}
        <span className="font-mono text-[10px] sm:text-xs text-pitch-700 w-10 sm:w-12 font-bold shrink-0">
          {match.matchTime ?? ""}
        </span>
        <div className="flex-1 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 items-center min-w-0">
          <div className="flex items-center gap-2 justify-end min-w-0">
            <span className="truncate min-w-0 text-xs sm:text-sm font-display uppercase">{match.homeTeam}</span>
            <TeamBadge code={match.homeCode} flag={match.homeFlag} logoUrl={homeLogoUrl} alt={match.homeTeam} size="sm" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <input type="number" min={0} max={20} value={home} onChange={(e) => setHome(e.target.value)} onBlur={commit} className="score-input w-12! h-11! text-xl!" />
            <span className="font-display text-xl text-pitch-950">·</span>
            <input type="number" min={0} max={20} value={away} onChange={(e) => setAway(e.target.value)} onBlur={commit} className="score-input w-12! h-11! text-xl!" />
          </div>
          <div className="flex items-center gap-2 justify-start min-w-0">
            <TeamBadge code={match.awayCode} flag={match.awayFlag} logoUrl={awayLogoUrl} alt={match.awayTeam} size="sm" />
            <span className="truncate min-w-0 text-xs sm:text-sm font-display uppercase">{match.awayTeam}</span>
          </div>
        </div>
        <div className="w-16 text-right shrink-0">
          {saving && <span className="font-mono text-[10px] text-pitch-700 animate-pulse uppercase tracking-wider">…</span>}
          {saved && <span className="font-mono text-[10px] text-grass-700 font-bold uppercase tracking-wider">✓</span>}
          {!saving && !saved && filled && (
            <button
              onClick={() => { setHome(""); setAway(""); setHomeAet(""); setAwayAet(""); setPenH(""); setPenA(""); onSave(match.id, null, null); }}
              className="font-mono text-[10px] text-pitch-700 hover:text-brick-500 uppercase tracking-widest font-bold"
            >
              {t.admin.deleteResult}
            </button>
          )}
        </div>
      </div>
      {showExtended && (
        <div className="mt-3 pt-3 border-t border-dashed border-pitch-950/20 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest shrink-0">{t.admin.aetLabel}</span>
          <div className="flex items-center gap-1">
            <input type="number" min={0} max={20} value={homeAet} onChange={(e) => setHomeAet(e.target.value)} onBlur={commit} placeholder="–" className="score-input w-10! h-9! text-base!" />
            <span className="font-display text-base text-pitch-950">·</span>
            <input type="number" min={0} max={20} value={awayAet} onChange={(e) => setAwayAet(e.target.value)} onBlur={commit} placeholder="–" className="score-input w-10! h-9! text-base!" />
          </div>
          <span className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest shrink-0">{t.admin.penLabel}</span>
          <div className="flex items-center gap-1">
            <input type="number" min={0} max={30} value={penH} onChange={(e) => setPenH(e.target.value)} onBlur={commit} placeholder="–" className="score-input w-10! h-9! text-base!" />
            <span className="font-display text-base text-pitch-950">·</span>
            <input type="number" min={0} max={30} value={penA} onChange={(e) => setPenA(e.target.value)} onBlur={commit} placeholder="–" className="score-input w-10! h-9! text-base!" />
          </div>
        </div>
      )}
    </div>
  );
}
