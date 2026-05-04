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
      <div className="flex gap-2 mb-6 border-b border-pitch-800">
        <TabButton active={tab === "results"} onClick={() => setTab("results")}>
          Resultados ({matches.filter((m) => m.homeScore != null).length}/
          {matches.length})
        </TabButton>
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Participantes ({participants.length})
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
      className={`px-4 py-3 font-mono text-xs uppercase tracking-widest font-semibold transition-colors border-b-2 -mb-px ${
        active
          ? "text-flame-500 border-flame-500"
          : "text-chalk-400 border-transparent hover:text-chalk-100"
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
          prev.map((m) =>
            m.id === id ? { ...m, homeScore, awayScore } : m
          )
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

      <div className="space-y-6">
        {grouped.map(([date, list]) => (
          <section key={date}>
            <h3 className="font-display text-xl text-flame-400 mb-2">
              {date.toUpperCase()}
            </h3>
            <div className="space-y-2">
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
      className={`px-3 py-2 rounded text-xs uppercase tracking-wider font-mono font-semibold transition-all ${
        active
          ? "bg-flame-500 text-pitch-950"
          : "bg-pitch-800 text-chalk-200 hover:bg-pitch-700"
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

  return (
    <div className="bg-pitch-900/60 border border-pitch-800 rounded-lg p-3 flex items-center gap-3">
      <span
        className={`group-${match.groupName} text-[10px] font-bold px-2 py-0.5 rounded font-mono`}
      >
        {match.groupName}
      </span>
      <span className="font-mono text-[10px] text-chalk-400 w-12">
        {match.matchTime}
      </span>
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="text-right text-sm font-bold text-chalk-50 truncate">
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
            className="score-input !w-12 !h-10 !text-lg"
          />
          <span className="text-chalk-400">·</span>
          <input
            type="number"
            min={0}
            max={20}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            onBlur={commit}
            className="score-input !w-12 !h-10 !text-lg"
          />
        </div>
        <div className="text-left text-sm font-bold text-chalk-50 truncate">
          {match.awayTeam} {match.awayFlag}
        </div>
      </div>
      <div className="w-20 text-right">
        {saving && (
          <span className="font-mono text-[10px] text-chalk-400 animate-pulse">
            ...
          </span>
        )}
        {saved && (
          <span className="font-mono text-[10px] text-grass-400">✓</span>
        )}
        {!saving && !saved && match.homeScore != null && (
          <button
            onClick={() => {
              setHome("");
              setAway("");
              onSave(match.id, null, null);
            }}
            className="font-mono text-[10px] text-chalk-400 hover:text-red-400"
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
      // Refresh list
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
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      <div>
        <h3 className="font-display text-2xl text-chalk-50 mb-3">
          Añadir participante
        </h3>
        <form
          onSubmit={create}
          className="bg-pitch-900/60 border border-pitch-800 rounded-2xl p-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-chalk-400 mb-2">
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
            <label className="block text-xs font-mono uppercase tracking-widest text-chalk-400 mb-2">
              PIN (opcional, mín. 4 dígitos · si lo dejas vacío se genera uno)
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="input-base w-full font-mono"
              placeholder="auto"
              minLength={4}
            />
          </div>
          {error && (
            <div className="bg-red-900/40 border border-red-800 text-red-200 text-sm rounded px-3 py-2">
              {error}
            </div>
          )}
          {created && (
            <div className="bg-grass-500/10 border border-grass-500/40 rounded-lg px-4 py-3">
              <div className="text-xs font-mono uppercase tracking-widest text-grass-400 mb-1">
                ✅ Creado · Comparte estos datos UNA vez
              </div>
              <div className="font-mono text-chalk-50">
                <div>
                  Nombre: <span className="font-bold">{created.name}</span>
                </div>
                <div>
                  PIN:{" "}
                  <span className="font-bold text-2xl text-flame-400 tracking-widest">
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
            {creating ? "Creando..." : "Crear participante"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-display text-2xl text-chalk-50 mb-3">
          Lista ({participants.length})
        </h3>
        <div className="bg-pitch-900/60 border border-pitch-800 rounded-2xl divide-y divide-pitch-800">
          {participants.length === 0 && (
            <div className="p-6 text-chalk-400 text-sm">
              Aún no hay participantes.
            </div>
          )}
          {participants.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-chalk-50">{p.name}</span>
              <button
                onClick={() => remove(p.id, p.name)}
                className="text-xs font-mono uppercase tracking-widest text-chalk-400 hover:text-red-400"
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
