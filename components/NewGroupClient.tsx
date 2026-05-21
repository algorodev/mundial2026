"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TournamentBadge from "@/components/TournamentBadge";
import GroupSettingsFields, {
  DEFAULT_SETTINGS,
  settingsToPayload,
  type GroupSettingsValue,
} from "@/components/GroupSettingsFields";

type Tournament = {
  slug: string;
  name: string;
  sport: string;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "En construcción",
  upcoming: "Inscripciones abiertas",
  live: "En curso",
  finished: "Terminado",
};

export default function NewGroupClient({
  tournaments,
  preselectSlug,
}: {
  tournaments: Tournament[];
  preselectSlug?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tournamentSlug, setTournamentSlug] = useState(
    preselectSlug ?? tournaments[0].slug
  );
  const [settings, setSettings] = useState<GroupSettingsValue>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
        body: JSON.stringify({
          name: name.trim(),
          tournamentSlug,
          ...settingsToPayload(settings),
        }),
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
    <form onSubmit={submit} className="cromo bg-pitch-900 p-6 sm:p-8 space-y-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tournaments.map((t) => {
            const active = tournamentSlug === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => setTournamentSlug(t.slug)}
                className={`cromo flex items-center gap-4 p-4 text-left transition-all ${
                  active
                    ? "bg-flame-500 text-pitch-950 -translate-x-0.5 -translate-y-0.5"
                    : "bg-paper-50 text-pitch-950 hover:-translate-y-0.5"
                }`}
              >
                <TournamentBadge
                  slug={t.slug}
                  name={t.name}
                  size="lg"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base sm:text-lg uppercase tracking-tight leading-tight">
                    {t.name}
                  </div>
                  <div
                    className={`mt-1 font-mono text-[10px] uppercase tracking-widest ${
                      active ? "text-pitch-950/70" : "text-pitch-700"
                    }`}
                  >
                    {STATUS_LABEL[t.status] ?? t.status}
                  </div>
                </div>
                {active && (
                  <span className="shrink-0 font-display text-2xl">✓</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
          Un grupo = un torneo. Si quieres dos porras, crea dos grupos.
        </p>
      </div>

      {/* Configuración avanzada — colapsable para no abrumar */}
      <div className="border-t-2 border-pitch-800 pt-5">
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="w-full flex items-center justify-between text-left font-display text-sm uppercase tracking-widest text-flame-400 hover:text-flame-300"
        >
          <span>⚙ Configuración avanzada</span>
          <span className="font-mono text-xs">{showAdvanced ? "▲" : "▼"}</span>
        </button>
        {showAdvanced && (
          <div className="mt-5">
            <GroupSettingsFields value={settings} onChange={setSettings} />
          </div>
        )}
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
