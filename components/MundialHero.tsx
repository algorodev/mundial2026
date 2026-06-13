"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";

type Props = {
  tournamentSlug: string;
  tournamentName: string;
  kickoffIso: string;
  kickoffLabel: string;
  status: "upcoming" | "live";
};

function diff(toMs: number, now: number) {
  let delta = Math.max(0, Math.floor((toMs - now) / 1000));
  const days = Math.floor(delta / 86400);
  delta -= days * 86400;
  const hours = Math.floor(delta / 3600);
  delta -= hours * 3600;
  const mins = Math.floor(delta / 60);
  const secs = delta - mins * 60;
  return { days, hours, mins, secs, done: toMs <= now };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export default function MundialHero({
  tournamentSlug,
  tournamentName,
  kickoffIso,
  kickoffLabel,
  status,
}: Props) {
  const { t } = useI18n();
  const toMs = new Date(kickoffIso).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLive = status === "live";
  const c = now != null ? diff(toMs, now) : null;
  const showCountdown = !isLive && c && !c.done;

  return (
    <section className="mt-16 sm:mt-20 max-w-3xl mx-auto relative">
      <div className="cromo bg-pitch-900 dark:bg-pitch-900 bg-white border-flame-500 p-6 sm:p-8 text-center rotate-[-0.6deg]">
        <span className="inline-block bg-flame-500 text-pitch-950 font-display text-xs sm:text-sm px-3 py-1 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {isLive ? t.mundialHero.live : t.mundialHero.upcoming}
        </span>
        <h2 className="mt-5 font-display text-4xl sm:text-6xl text-chalk-50 dark:text-chalk-50 text-pitch-900 leading-none uppercase">
          {tournamentName}
        </h2>

        {showCountdown && c && (
          <>
            <p className="mt-5 font-mono text-[11px] text-chalk-300 dark:text-chalk-300 text-pitch-700 uppercase tracking-widest">
              {t.mundialHero.startsAt.replace("{label}", kickoffLabel)}
            </p>
            <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
              <CountBox label={t.mundialHero.days} value={c.days} />
              <CountBox label={t.mundialHero.hours} value={pad(c.hours)} />
              <CountBox label={t.mundialHero.minutes} value={pad(c.mins)} />
              <CountBox label={t.mundialHero.seconds} value={pad(c.secs)} />
            </div>
          </>
        )}

        {isLive && (
          <p className="mt-5 font-mono text-sm text-grass-400 uppercase tracking-widest">
            {t.mundialHero.liveMessage}
          </p>
        )}

        {now != null && !showCountdown && !isLive && (
          <p className="mt-5 font-mono text-sm text-flame-400 uppercase tracking-widest">
            {t.mundialHero.ballRolling}
          </p>
        )}

        <Link
          href={`/groups/new?preselect=${encodeURIComponent(tournamentSlug)}`}
          className="btn-primary mt-7 inline-block"
        >
          {t.mundialHero.createPool.replace("{tournament}", tournamentName.split(" ")[0])}
        </Link>
        <p className="mt-3 font-mono text-[10px] text-chalk-400 dark:text-chalk-400 text-pitch-500 uppercase tracking-widest">
          {t.mundialHero.freeNote}
        </p>
      </div>
    </section>
  );
}

function CountBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="cromo bg-paper-50 text-pitch-950 p-2 sm:p-3">
      <div className="font-display text-3xl sm:text-5xl leading-none">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-pitch-700 mt-1">
        {label}
      </div>
    </div>
  );
}
