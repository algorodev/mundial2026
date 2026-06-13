"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

type Row = {
  position: number;
  userId: number;
  name: string;
  total: number;
  exact: number;
  outcome: number;
  miss: number;
  played: number;
};

export default function LeaderboardClient({
  groupSlug,
  currentName,
  tournamentStartIso,
  tournamentStartLabel,
  predictionsVisibility,
}: {
  groupSlug: string;
  currentName: string;
  tournamentStartIso: string;
  tournamentStartLabel: string;
  // 'open' → siempre se pueden ver los pronósticos ajenos (rows clickables)
  // 'hidden-until-lock' → solo cuando arranca el torneo (default)
  predictionsVisibility: "open" | "hidden-until-lock";
}) {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch(
        `/api/leaderboard?groupSlug=${encodeURIComponent(groupSlug)}`,
        { cache: "no-store" }
      );
      if (!r.ok) throw new Error("err");
      const d = await r.json();
      setRows(d.leaderboard);
      setUpdatedAt(new Date());
      setError(null);
    } catch {
      setError(t.leaderboard.errorLoading);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const tournamentStarted =
    Date.now() >= new Date(tournamentStartIso).getTime();
  // Los rows son clickables (pronósticos ajenos visibles) si el grupo lo
  // permite explícitamente o si el torneo ya ha empezado.
  const peersVisible = predictionsVisibility === "open" || tournamentStarted;

  if (rows === null) {
    return (
      <div className="text-center py-16 text-pitch-500 dark:text-chalk-400 font-mono text-sm uppercase tracking-widest animate-pulse">
        {t.leaderboard.loading}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="cromo bg-paper-50 text-pitch-950 max-w-xl mx-auto p-8 text-center">
        <p className="font-display text-2xl mb-2">{t.leaderboard.noParticipants}</p>
        <p className="text-pitch-700">
          {t.leaderboard.noParticipantsDesc}
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 mb-6 font-semibold text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Aviso sobre visibilidad de pronósticos ajenos */}
      <div
        className={`cromo px-4 py-3 mb-8 font-mono text-[11px] uppercase tracking-widest ${
          peersVisible
            ? "bg-grass-500 text-paper-50"
            : "bg-paper-100 dark:bg-pitch-900 text-pitch-700 dark:text-chalk-300"
        }`}
      >
        {peersVisible ? (
          <>{t.leaderboard.peersVisible}</>
        ) : (
          <>
            {t.leaderboard.peersHidden.replace("{label}", tournamentStartLabel)}
          </>
        )}
      </div>

      {/* Podio */}
      {rows.length >= 3 && rows[0].played > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-12 sm:mb-16 items-end px-2">
          <PodiumCard
            row={rows[1]}
            place={2}
            clickable={peersVisible}
            groupSlug={groupSlug}
            labelPoints={t.leaderboard.puntos}
          />
          <PodiumCard
            row={rows[0]}
            place={1}
            clickable={peersVisible}
            groupSlug={groupSlug}
            labelPoints={t.leaderboard.puntos}
          />
          <PodiumCard
            row={rows[2]}
            place={3}
            clickable={peersVisible}
            groupSlug={groupSlug}
            labelPoints={t.leaderboard.puntos}
          />
        </div>
      )}

      {/* Lista — cromos apilados */}
      <div className="space-y-3 sm:space-y-4">
        {rows.map((row) => (
          <LeaderboardRow
            key={row.userId}
            row={row}
            isMe={row.name === currentName}
            clickable={peersVisible}
            groupSlug={groupSlug}
            labelYou={t.common.you}
            labelEx={t.leaderboard.ex}
            labelSg={t.leaderboard.sg}
            labelFa={t.leaderboard.fa}
            labelJug={t.leaderboard.jug}
            labelPts={t.leaderboard.pts}
          />
        ))}
      </div>

      {updatedAt && (
        <p className="mt-10 text-center font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
          {t.leaderboard.updatedAt.replace("{time}", updatedAt.toLocaleTimeString("es-ES"))}
        </p>
      )}
    </>
  );
}

function LeaderboardRow({
  row,
  isMe,
  clickable,
  groupSlug,
  labelYou,
  labelEx,
  labelSg,
  labelFa,
  labelJug,
  labelPts,
}: {
  row: Row;
  isMe: boolean;
  clickable: boolean;
  groupSlug: string;
  labelYou: string;
  labelEx: string;
  labelSg: string;
  labelFa: string;
  labelJug: string;
  labelPts: string;
}) {
  const tone = isMe
    ? "bg-flame-500 text-pitch-950"
    : "bg-paper-50 dark:bg-pitch-900 text-pitch-900 dark:text-chalk-50";
  const accentTotal = isMe ? "text-pitch-950" : "text-pitch-700 dark:text-flame-500";
  const accentPos = isMe ? "text-pitch-950" : "text-pitch-700 dark:text-flame-500";

  const interactive = clickable
    ? "hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all cursor-pointer"
    : "";

  const content = (
    <>
      <div
        className={`font-display text-4xl sm:text-6xl w-12 sm:w-20 leading-none text-center flex items-center justify-center ${accentPos}`}
      >
        {row.position === 1 ? (
          <Trophy size={36} strokeWidth={2.5} className="sm:size-[52px]" />
        ) : row.position === 2 || row.position === 3 ? (
          <Medal size={30} strokeWidth={2.5} className="sm:size-[42px]" />
        ) : (
          row.position
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-display text-xl sm:text-2xl tracking-tight truncate min-w-0 uppercase">
            {row.name}
          </span>
          {isMe && (
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-80 shrink-0">
              {labelYou}
            </span>
          )}
        </div>
        <div className="flex gap-3 sm:gap-4 mt-1 text-[10px] font-mono uppercase tracking-widest opacity-80">
          <span>
            <strong className={isMe ? "text-pitch-950" : "text-grass-400"}>
              {row.exact}
            </strong>{" "}
            {labelEx}
          </span>
          <span>
            <strong className={isMe ? "text-pitch-950" : "text-pitch-700 dark:text-flame-400"}>
              {row.outcome}
            </strong>{" "}
            {labelSg}
          </span>
          <span>
            <strong>{row.miss}</strong> {labelFa}
          </span>
          <span className="hidden sm:inline">· {row.played} {labelJug}</span>
        </div>
      </div>
      <div
        className={`font-display text-4xl sm:text-5xl ${accentTotal} flex items-baseline gap-1`}
      >
        {row.total}
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
          {labelPts}
        </span>
      </div>
      {clickable && (
        <span
          className={`hidden sm:block font-display text-2xl ${
            isMe ? "text-pitch-950/60" : "text-pitch-500 dark:text-chalk-400"
          }`}
          aria-hidden
        >
          ›
        </span>
      )}
    </>
  );

  const className = `cromo ${tone} flex items-center gap-3 sm:gap-5 p-4 sm:p-5 ${interactive}`;

  if (clickable) {
    return (
      <Link href={`/g/${groupSlug}/leaderboard/${row.userId}`} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

function PodiumCard({
  row,
  place,
  clickable,
  groupSlug,
  labelPoints,
}: {
  row: Row;
  place: 1 | 2 | 3;
  clickable: boolean;
  groupSlug: string;
  labelPoints: string;
}) {
  // min-h en vez de h fija: la altura sigue marcando la jerarquía del
  // podio (1º más alto, 3º más bajo) pero deja crecer si un nombre es muy
  // largo, en vez de recortarlo. line-clamp-3 evita explosiones de altura.
  const styles = {
    1: {
      h: "min-h-56 sm:min-h-72",
      bg: "bg-flame-500",
      text: "text-pitch-950",
      medal: "🥇",
      rotate: "rotate-1",
    },
    2: {
      h: "min-h-48 sm:min-h-60",
      bg: "bg-paper-100",
      text: "text-pitch-950",
      medal: "🥈",
      rotate: "-rotate-2",
    },
    3: {
      h: "min-h-44 sm:min-h-52",
      bg: "bg-brick-500",
      text: "text-paper-50",
      medal: "🥉",
      rotate: "rotate-1",
    },
  } as const;
  const s = styles[place];
  const inner = (
    <div
      className={`flex flex-col items-stretch ${s.rotate} hover:rotate-0 transition-transform`}
    >
      <div className="text-center text-3xl sm:text-5xl mb-2">{s.medal}</div>
      <div
        className={`cromo ${s.h} ${s.bg} ${s.text} flex flex-col items-center justify-end p-3 sm:p-4`}
      >
        <div className="font-display text-5xl sm:text-7xl leading-none tabular-nums">
          {row.total}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-widest opacity-70 mt-1">
          {labelPoints}
        </div>
        <div className="font-display text-sm sm:text-base mt-3 text-center leading-tight tracking-tight uppercase wrap-break-word line-clamp-3 max-w-full text-balance">
          {row.name}
        </div>
      </div>
    </div>
  );
  if (clickable) {
    return (
      <Link href={`/g/${groupSlug}/leaderboard/${row.userId}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
