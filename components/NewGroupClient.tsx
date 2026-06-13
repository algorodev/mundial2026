"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import TournamentBadge from "@/components/TournamentBadge";
import GroupSettingsFields, {
  DEFAULT_SETTINGS,
  settingsToPayload,
  type GroupSettingsValue,
} from "@/components/GroupSettingsFields";
import { useI18n } from "@/providers/I18nProvider";

type Tournament = {
  slug: string;
  name: string;
  sport: string;
  status: string;
};

export default function NewGroupClient({
  tournaments,
  preselectSlug,
}: {
  tournaments: Tournament[];
  preselectSlug?: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [tournamentSlug, setTournamentSlug] = useState(
    preselectSlug ?? tournaments[0].slug
  );
  const [settings, setSettings] = useState<GroupSettingsValue>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const STATUS_LABEL: Record<string, string> = {
    draft: t.home.statusDraft,
    upcoming: t.home.statusUpcoming,
    live: t.home.statusLive,
    finished: t.home.statusFinished,
  };

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
        setError(data.error || t.groups.errorCreating);
        return;
      }
      router.push(`/g/${data.group.slug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="cromo bg-paper-50 dark:bg-pitch-900 p-6 sm:p-8 space-y-6">
      <div>
        <label className="block text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
          {t.groups.groupNameLabel}
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-base w-full"
          placeholder={t.groups.groupNamePlaceholder}
          minLength={3}
          maxLength={80}
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
          {t.groups.tournamentLabel}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tournaments.map((tournament) => {
            const active = tournamentSlug === tournament.slug;
            return (
              <button
                key={tournament.slug}
                type="button"
                onClick={() => setTournamentSlug(tournament.slug)}
                className={`cromo flex items-center gap-4 p-4 text-left transition-all ${
                  active
                    ? "bg-flame-500 text-pitch-950 -translate-x-0.5 -translate-y-0.5"
                    : "bg-paper-50 text-pitch-950 hover:-translate-y-0.5"
                }`}
              >
                <TournamentBadge
                  slug={tournament.slug}
                  name={tournament.name}
                  size="lg"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base sm:text-lg uppercase tracking-tight leading-tight">
                    {tournament.name}
                  </div>
                  <div
                    className={`mt-1 font-mono text-[10px] uppercase tracking-widest ${
                      active ? "text-pitch-950/70" : "text-pitch-700"
                    }`}
                  >
                    {STATUS_LABEL[tournament.status] ?? tournament.status}
                  </div>
                </div>
                {active && (
                  <span className="shrink-0 font-display text-2xl">✓</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
          {t.groups.oneGroupOneTournament}
        </p>
      </div>

      {/* Configuración avanzada — colapsable para no abrumar */}
      <div className="border-t-2 border-paper-200 dark:border-pitch-800 pt-5">
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="w-full flex items-center justify-between text-left font-display text-sm uppercase tracking-widest text-flame-400 hover:text-flame-300"
        >
          <span>{t.groups.advancedSettings}</span>
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

      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? t.groups.creating : t.groups.createSubmit}
        {!loading && <ArrowRight size={16} strokeWidth={2.5} />}
      </button>
    </form>
  );
}
