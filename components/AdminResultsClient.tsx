"use client";

import { useState, useMemo } from "react";
import TeamBadge from "@/components/TeamBadge";

type MatchRow = {
  id: number;
  tournamentId: number;
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

export default function AdminResultsClient({
  tournamentSlug,
  matches,
}: {
  tournamentSlug: string;
  matches: MatchRow[];
}) {
  const [list, setList] = useState(matches);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

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
    awayScore: number | null
  ) {
    setSavingId(id);
    try {
      const r = await fetch(`/api/admin/t/${tournamentSlug}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id, homeScore, awayScore }),
      });
      if (r.ok) {
        setList((prev) =>
          prev.map((m) => (m.id === id ? { ...m, homeScore, awayScore } : m))
        );
        setSavedId(id);
        setTimeout(() => setSavedId(null), 1200);
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Todos ({list.length})
        </FilterChip>
        <FilterChip
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        >
          Sin resultado ({list.filter((m) => m.homeScore == null).length})
        </FilterChip>
        <FilterChip
          active={filter === "done"}
          onClick={() => setFilter("done")}
        >
          Con resultado ({list.filter((m) => m.homeScore != null).length})
        </FilterChip>
      </div>

      <div className="space-y-8">
        {grouped.map(([date, items]) => (
          <section key={date}>
            <h3 className="mb-4 flex items-center gap-3">
              <span className="h-1 flex-1 bg-pitch-800" />
              <span className="bg-flame-500 text-pitch-950 font-display text-lg px-4 py-1 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
                {date}
              </span>
              <span className="h-1 flex-1 bg-pitch-800" />
            </h3>
            <div className="space-y-2 px-1">
              {items.map((m) => (
                <ResultRow
                  key={m.id}
                  match={m}
                  saving={savingId === m.id}
                  saved={savedId === m.id}
                  onSave={saveResult}
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
}: {
  match: MatchRow;
  saving: boolean;
  saved: boolean;
  onSave: (id: number, h: number | null, a: number | null) => void;
}) {
  const [home, setHome] = useState(
    match.homeScore != null ? String(match.homeScore) : ""
  );
  const [away, setAway] = useState(
    match.awayScore != null ? String(match.awayScore) : ""
  );

  function commit() {
    if (home === "" && away === "") {
      onSave(match.id, null, null);
      return;
    }
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (Number.isInteger(h) && Number.isInteger(a) && h >= 0 && a >= 0) {
      onSave(match.id, h, a);
    }
  }

  const filled = match.homeScore != null;

  return (
    <div
      className={`cromo ${
        filled ? "bg-grass-300" : "bg-paper-50"
      } text-pitch-950 p-3 sm:p-4 flex items-center gap-3`}
    >
      {match.groupName && (
        <span
          className={`group-${match.groupName} text-[10px] px-2 py-0.5 rounded-sm`}
        >
          {match.groupName}
        </span>
      )}
      <span className="font-mono text-[10px] sm:text-xs text-pitch-700 w-10 sm:w-12 font-bold">
        {match.matchTime ?? ""}
      </span>
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center min-w-0">
        <div className="text-right text-xs sm:text-sm font-display uppercase truncate flex items-center gap-2 justify-end">
          <span className="truncate">{match.homeTeam}</span>
          <TeamBadge
            code={match.homeCode}
            flag={match.homeFlag}
            alt={match.homeTeam}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={20}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            onBlur={commit}
            className="score-input w-12! h-11! text-xl!"
          />
          <span className="font-display text-xl text-pitch-950">·</span>
          <input
            type="number"
            min={0}
            max={20}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            onBlur={commit}
            className="score-input w-12! h-11! text-xl!"
          />
        </div>
        <div className="text-left text-xs sm:text-sm font-display uppercase truncate flex items-center gap-2 justify-start">
          <TeamBadge
            code={match.awayCode}
            flag={match.awayFlag}
            alt={match.awayTeam}
            size="sm"
          />
          <span className="truncate">{match.awayTeam}</span>
        </div>
      </div>
      <div className="w-16 text-right">
        {saving && (
          <span className="font-mono text-[10px] text-pitch-700 animate-pulse uppercase tracking-wider">
            …
          </span>
        )}
        {saved && (
          <span className="font-mono text-[10px] text-grass-700 font-bold uppercase tracking-wider">
            ✓
          </span>
        )}
        {!saving && !saved && filled && (
          <button
            onClick={() => {
              setHome("");
              setAway("");
              onSave(match.id, null, null);
            }}
            className="font-mono text-[10px] text-pitch-700 hover:text-brick-500 uppercase tracking-widest font-bold"
          >
            borrar
          </button>
        )}
      </div>
    </div>
  );
}
