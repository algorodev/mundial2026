"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tournament = {
  slug: string;
  name: string;
  sport: string;
  status: string;
};

export default function NewGroupClient({
  tournaments,
}: {
  tournaments: Tournament[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tournamentSlug, setTournamentSlug] = useState(tournaments[0].slug);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), tournamentSlug }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error creando el grupo");
        return;
      }
      router.push(`/g/${data.group.slug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="cromo bg-pitch-900 p-6 sm:p-8 space-y-5">
      <div>
        <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
          Nombre del grupo
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-base w-full"
          placeholder="Ej: La porra de la oficina"
          minLength={3}
          maxLength={80}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
          Torneo
        </label>
        <select
          value={tournamentSlug}
          onChange={(e) => setTournamentSlug(e.target.value)}
          className="input-base w-full"
        >
          {tournaments.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
              {t.status !== "upcoming" ? ` · ${t.status}` : ""}
            </option>
          ))}
        </select>
        <p className="mt-2 font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
          Un grupo = un torneo. Si quieres dos porras, crea dos grupos.
        </p>
      </div>

      {error && (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
          ⚠️ {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Creando..." : "Crear grupo →"}
      </button>
    </form>
  );
}
