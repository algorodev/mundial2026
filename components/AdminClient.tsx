"use client";

import { useState, useMemo } from "react";

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

type Participant = {
  id: number;
  name: string;
  createdAt: string;
};

export default function AdminClient({
  matches,
  participants,
}: {
  matches: MatchRow[];
  participants: Participant[];
}) {
  const [tab, setTab] = useState<"results" | "users">("results");

  return (
    <div>
      <div className="flex gap-3 mb-8 flex-wrap">
        <TabButton active={tab === "results"} onClick={() => setTab("results")}>
          ⚽ Resultados ({matches.filter((m) => m.homeScore != null).length}/
          {matches.length})
        </TabButton>
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          👥 Participantes ({participants.length})
        </TabButton>
      </div>

      {tab === "results" && <ResultsTab initial={matches} />}
      {tab === "users" && <UsersTab initial={participants} />}
    </div>
  );
}

function TabButton({
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
      className={`px-5 py-3 font-display text-xs sm:text-sm uppercase tracking-widest border-2 border-pitch-950 rounded transition-all ${
        active
          ? "bg-flame-500 text-pitch-950 shadow-brutal -translate-x-0.5 -translate-y-0.5"
          : "bg-paper-50 text-pitch-950 shadow-brutal-sm hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}

function ResultsTab({ initial }: { initial: MatchRow[] }) {
  const [matches, setMatches] = useState(initial);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const visible = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "pending") return m.homeScore == null;
      if (filter === "done") return m.homeScore != null;
      return true;
    });
  }, [matches, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const m of visible) {
      if (!map.has(m.matchDate)) map.set(m.matchDate, []);
      map.get(m.matchDate)!.push(m);
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
      const r = await fetch("/api/admin/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id, homeScore, awayScore }),
      });
      if (r.ok) {
        setMatches((prev) =>
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
          Todos
        </FilterChip>
        <FilterChip
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        >
          Sin resultado
        </FilterChip>
        <FilterChip
          active={filter === "done"}
          onClick={() => setFilter("done")}
        >
          Con resultado
        </FilterChip>
      </div>

      <div className="space-y-8">
        {grouped.map(([date, list]) => (
          <section key={date}>
            <h3 className="mb-4 flex items-center gap-3">
              <span className="h-1 flex-1 bg-pitch-800" />
              <span className="bg-flame-500 text-pitch-950 font-display text-lg px-4 py-1 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
                {date}
              </span>
              <span className="h-1 flex-1 bg-pitch-800" />
            </h3>
            <div className="space-y-2 px-1">
              {list.map((m) => (
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
      <span
        className={`group-${match.groupName} text-[10px] px-2 py-0.5 rounded-sm`}
      >
        {match.groupName}
      </span>
      <span className="font-mono text-[10px] sm:text-xs text-pitch-700 w-10 sm:w-12 font-bold">
        {match.matchTime}
      </span>
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center min-w-0">
        <div className="text-right text-xs sm:text-sm font-display uppercase truncate">
          {match.homeFlag} {match.homeTeam}
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
        <div className="text-left text-xs sm:text-sm font-display uppercase truncate">
          {match.awayTeam} {match.awayFlag}
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

function UsersTab({ initial }: { initial: Participant[] }) {
  const [participants, setParticipants] = useState(initial);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{
    name: string;
    pin: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setCreated(null);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin: pin || undefined }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Error");
        return;
      }
      setCreated({ name: d.name, pin: d.pin });
      setName("");
      setPin("");
      const list = await fetch("/api/admin/users").then((r) => r.json());
      setParticipants(list.users || []);
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: number, n: string) {
    if (!confirm(`¿Borrar a "${n}"? Se perderán todas sus predicciones.`))
      return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setParticipants((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
      {/* Crear */}
      <div>
        <h3 className="font-display text-2xl sm:text-3xl text-chalk-50 mb-4 uppercase">
          ➕ Añadir
        </h3>
        <form onSubmit={create} className="cromo bg-pitch-900 p-6 space-y-5">
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base w-full"
              placeholder="Ej: Lucía"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
              PIN (opcional, mín. 4 dígitos)
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="input-base w-full font-mono tracking-widest"
              placeholder="auto si lo dejas vacío"
              minLength={4}
            />
          </div>
          {error && (
            <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}
          {created && (
            <div className="cromo bg-grass-300 text-pitch-950 p-4">
              <div className="text-xs font-display uppercase tracking-widest mb-2">
                ✅ CREADO · Comparte UNA vez
              </div>
              <div className="font-mono text-sm">
                <div>
                  Nombre: <strong>{created.name}</strong>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  PIN:{" "}
                  <span className="font-display text-3xl sm:text-4xl text-brick-500 tracking-widest">
                    {created.pin}
                  </span>
                </div>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={creating}
            className="btn-primary w-full"
          >
            {creating ? "Creando..." : "Crear participante →"}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div>
        <h3 className="font-display text-2xl sm:text-3xl text-chalk-50 mb-4 uppercase">
          👥 Lista ({participants.length})
        </h3>
        <div className="space-y-2">
          {participants.length === 0 && (
            <div className="cromo bg-paper-50 text-pitch-700 p-6 text-sm text-center font-mono uppercase tracking-widest">
              Aún no hay participantes
            </div>
          )}
          {participants.map((p) => (
            <div
              key={p.id}
              className="cromo bg-paper-50 text-pitch-950 px-4 py-3 flex items-center justify-between"
            >
              <span className="font-display text-lg uppercase tracking-tight">
                {p.name}
              </span>
              <button
                onClick={() => remove(p.id, p.name)}
                className="font-mono text-[10px] text-pitch-700 hover:text-brick-500 uppercase tracking-widest font-bold"
              >
                Borrar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
