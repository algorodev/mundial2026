"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { ROUND_PHASE_LABELS } from "@/lib/knockout-phases";

type GroupStats = {
  totalExact: number;
  totalPredictions: number;
  topAcertante: { userId: number; name: string | null; exact: number; total: number } | null;
  longestStreak: { userId: number; name: string | null; streak: number } | null;
  bestRound: { key: string; label: string; exactCount: number } | null;
  biggestBlowout: {
    userId: number;
    name: string | null;
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    margin: number;
  } | null;
};

type ForecastEntry = {
  code: string;
  pct: number;
  name: string;
  flag: string | null;
  logoUrl: string | null;
};

const ROUND_KEYS = new Set<string>(ROUND_PHASE_LABELS);

export default function StatsClient({
  groupSlug,
  forecast,
  forecastSnapshotDate,
}: {
  groupSlug: string;
  forecast?: ForecastEntry[];
  forecastSnapshotDate?: string;
}) {
  const { t } = useI18n();
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stats?groupSlug=${encodeURIComponent(groupSlug)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setError(d.error ?? t.stats.errorLoading);
          return;
        }
        setStats(d.stats);
      })
      .catch(() => {
        if (!cancelled) setError(t.stats.errorLoading);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupSlug]);

  if (error) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-widest text-brick-500 text-center py-10">
        {error}
      </p>
    );
  }

  if (!stats) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-500 dark:text-chalk-400 text-center py-10 animate-pulse">
        {t.stats.loading}
      </p>
    );
  }

  const hasAny =
    stats.topAcertante || stats.longestStreak || stats.bestRound || stats.biggestBlowout;
  const hasForecast = forecast && forecast.length > 0;

  const bestRoundLabel = stats.bestRound
    ? ROUND_KEYS.has(stats.bestRound.key)
      ? t.bracket[stats.bestRound.key as (typeof ROUND_PHASE_LABELS)[number]]
      : stats.bestRound.label
    : "";

  return (
    <div className="space-y-6">
      {!hasAny && !hasForecast && (
        <div className="cromo bg-paper-50 text-pitch-950 p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-500">
            {t.stats.empty}
          </p>
        </div>
      )}

      {hasAny && (
        <>
          <div className="grid grid-cols-2 gap-4 cromo bg-paper-50 text-pitch-950 p-5 sm:p-6">
            <MiniStat value={stats.totalExact} label={t.stats.totalExact} />
            <MiniStat value={stats.totalPredictions} label={t.stats.totalPredictions} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {stats.topAcertante && (
              <StatCard
                icon="🎯"
                title={t.stats.topAcertante.title}
                desc={t.stats.topAcertante.desc
                  .replace("{name}", stats.topAcertante.name ?? "—")
                  .replace("{exact}", String(stats.topAcertante.exact))
                  .replace("{total}", String(stats.topAcertante.total))}
              />
            )}
            {stats.longestStreak && (
              <StatCard
                icon="🔥"
                title={t.stats.longestStreak.title}
                desc={t.stats.longestStreak.desc
                  .replace("{name}", stats.longestStreak.name ?? "—")
                  .replace("{streak}", String(stats.longestStreak.streak))}
              />
            )}
            {stats.bestRound && (
              <StatCard
                icon="📅"
                title={t.stats.bestRound.title}
                desc={t.stats.bestRound.desc
                  .replace("{label}", bestRoundLabel)
                  .replace("{count}", String(stats.bestRound.exactCount))}
              />
            )}
            {stats.biggestBlowout && (
              <StatCard
                icon="💥"
                title={t.stats.biggestBlowout.title}
                desc={t.stats.biggestBlowout.desc
                  .replace("{name}", stats.biggestBlowout.name ?? "—")
                  .replace("{home}", String(stats.biggestBlowout.homeScore))
                  .replace("{away}", String(stats.biggestBlowout.awayScore))
                  .replace("{homeTeam}", stats.biggestBlowout.homeTeam)
                  .replace("{awayTeam}", stats.biggestBlowout.awayTeam)}
              />
            )}
          </div>
        </>
      )}

      {hasForecast && (
        <ForecastSection entries={forecast!} snapshotDate={forecastSnapshotDate} />
      )}
    </div>
  );
}

function ForecastSection({
  entries,
  snapshotDate,
}: {
  entries: ForecastEntry[];
  snapshotDate?: string;
}) {
  const { t } = useI18n();
  const max = entries[0]?.pct ?? 1;
  return (
    <section className="cromo bg-paper-50 text-pitch-950 p-5 sm:p-6">
      <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-tight">
        {t.stats.forecast.title}
      </h2>
      <p className="mt-1 mb-5 font-mono text-[10px] uppercase tracking-widest text-pitch-500">
        {t.stats.forecast.subtitle.replace("{date}", snapshotDate ?? "")}
      </p>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.code} className="flex items-center gap-3">
            <span className="w-6 text-center shrink-0">{e.flag}</span>
            <span className="w-28 sm:w-36 shrink-0 font-display uppercase text-xs sm:text-sm truncate">
              {e.name}
            </span>
            <div className="flex-1 h-4 bg-pitch-100 rounded-sm overflow-hidden">
              <div
                className="h-full bg-flame-500"
                style={{ width: `${Math.max(2, (e.pct / max) * 100)}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums">
              {e.pct}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-4xl sm:text-5xl leading-none text-pitch-900 dark:text-flame-500">
        {value}
      </div>
      <div className="font-mono text-[10px] text-pitch-500 uppercase tracking-widest mt-2">
        {label}
      </div>
    </div>
  );
}

function StatCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="cromo bg-paper-50 text-pitch-950 p-5 sm:p-6 flex gap-3">
      <span className="text-3xl leading-none shrink-0">{icon}</span>
      <div className="min-w-0">
        <h3 className="font-display uppercase text-lg tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-pitch-700 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
