"use client";

import { useEffect, useRef, useState } from "react";
import TeamBadge from "@/components/TeamBadge";

type LiveMatch = {
  id: number;
  matchNumber: number;
  groupName: string | null;
  homeTeam: string;
  awayTeam: string;
  homeCode: string | null;
  awayCode: string | null;
  homeFlag: string | null;
  awayFlag: string | null;
  homeScore: number;
  awayScore: number;
  kickoffAt: string;
  minute: number;
};

type NextMatch = {
  id: number;
  matchNumber: number;
  groupName: string | null;
  homeTeam: string;
  awayTeam: string;
  homeCode: string | null;
  awayCode: string | null;
  homeFlag: string | null;
  awayFlag: string | null;
  kickoffAt: string;
};

const STORAGE_KEY = "porra-live-open";
const POLL_MS = 12_000;

export default function LiveScoreboard({
  groupSlug,
}: {
  groupSlug: string;
}) {
  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [live, setLive] = useState<LiveMatch[]>([]);
  const [next, setNext] = useState<NextMatch | null>(null);
  const [offset, setOffset] = useState(0);
  const [, setTick] = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Restaurar estado abierto/cerrado tras hidratar
  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "0") setOpen(false);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  }, [open, hydrated]);

  // Polling
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(
          `/api/live?groupSlug=${encodeURIComponent(groupSlug)}`,
          { cache: "no-store" }
        );
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (cancelled) return;
        setLive(d.live);
        setNext(d.next);
        setOffset(d.serverNow - Date.now());
      } catch {
        // silenciar errores de red, próximo tick lo resolverá
      }
    }
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [groupSlug]);

  // Reloj local para countdown / minutos en vivo
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const realNow = Date.now() + offset;

  // Botón flotante (cerrado)
  if (!open) {
    const badge =
      live.length > 0
        ? `${live.length} EN VIVO`
        : next
          ? "PRÓXIMO"
          : "MARCADOR";
    const pulsing = live.length > 0;
    return (
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 right-4 z-40 cromo bg-flame-500 text-pitch-950 px-4 py-3 font-display uppercase tracking-widest text-xs hover:-translate-y-0.5 transition-transform ${
          pulsing ? "ring-2 ring-grass-400 ring-offset-2 ring-offset-pitch-950" : ""
        }`}
        aria-label="Mostrar marcador en vivo"
      >
        ⚽ {badge}
      </button>
    );
  }

  return (
    <aside
      className="fixed z-40 bottom-4 right-4 left-4 sm:left-auto sm:w-88 cromo bg-pitch-900 text-chalk-50 max-h-[70vh] flex flex-col overflow-hidden"
      aria-label="Marcador en vivo"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b-2 border-pitch-700 bg-pitch-950 shrink-0">
        <span className="font-display text-sm uppercase tracking-widest flex items-center gap-2">
          {live.length > 0 ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-grass-400 animate-pulse" />
              EN VIVO · {live.length}
            </>
          ) : next ? (
            <>⏱ PRÓXIMO PARTIDO</>
          ) : (
            <>⚽ MARCADOR</>
          )}
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-chalk-400 hover:text-flame-400 transition-colors font-display text-lg leading-none px-2"
          aria-label="Ocultar marcador"
        >
          ✕
        </button>
      </header>

      <div className="overflow-y-auto p-3 space-y-3">
        {live.length > 0 ? (
          live.map((m) => <LiveRow key={m.id} match={m} />)
        ) : next ? (
          <Countdown next={next} realNow={realNow} />
        ) : (
          <p className="font-mono text-[11px] text-chalk-400 uppercase tracking-widest text-center py-6">
            No hay partidos pendientes
          </p>
        )}
      </div>
    </aside>
  );
}

function LiveRow({ match }: { match: LiveMatch }) {
  return (
    <div className="cromo-sm bg-paper-50 text-pitch-950 p-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className={`group-${match.groupName} text-[9px] px-2 py-0.5 rounded-sm`}
        >
          GRUPO {match.groupName}
        </span>
        <span className="font-mono text-[10px] text-grass-600 font-bold uppercase tracking-widest flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-grass-500 animate-pulse" />
          {match.minute}'
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="text-right min-w-0">
          <div className="flex justify-end leading-none">
            <TeamBadge
              code={match.homeCode}
              flag={match.homeFlag}
              alt={match.homeTeam}
              size="sm"
            />
          </div>
          <div className="font-display uppercase text-xs leading-tight tracking-tight truncate mt-0.5">
            {match.homeTeam}
          </div>
        </div>
        <div className="font-display text-2xl text-pitch-950 px-2 whitespace-nowrap">
          {match.homeScore}
          <span className="text-brick-500 mx-1">·</span>
          {match.awayScore}
        </div>
        <div className="text-left min-w-0">
          <div className="flex justify-start leading-none">
            <TeamBadge
              code={match.awayCode}
              flag={match.awayFlag}
              alt={match.awayTeam}
              size="sm"
            />
          </div>
          <div className="font-display uppercase text-xs leading-tight tracking-tight truncate mt-0.5">
            {match.awayTeam}
          </div>
        </div>
      </div>
    </div>
  );
}

function Countdown({ next, realNow }: { next: NextMatch; realNow: number }) {
  const remainingMs = Math.max(0, new Date(next.kickoffAt).getTime() - realNow);
  const totalSec = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  return (
    <div className="cromo-sm bg-paper-50 text-pitch-950 p-4 text-center">
      <p className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest mb-2">
        Próximo · Grupo {next.groupName}
      </p>
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="flex flex-col items-center min-w-0">
          <TeamBadge
            code={next.homeCode}
            flag={next.homeFlag}
            alt={next.homeTeam}
            size="sm"
          />
          <span className="font-display uppercase text-[11px] tracking-tight mt-0.5 truncate max-w-28">
            {next.homeTeam}
          </span>
        </div>
        <span className="font-display text-pitch-700 text-lg">vs</span>
        <div className="flex flex-col items-center min-w-0">
          <TeamBadge
            code={next.awayCode}
            flag={next.awayFlag}
            alt={next.awayTeam}
            size="sm"
          />
          <span className="font-display uppercase text-[11px] tracking-tight mt-0.5 truncate max-w-28">
            {next.awayTeam}
          </span>
        </div>
      </div>
      <div className="font-display text-3xl text-flame-600 tracking-wider tabular-nums">
        {days > 0 && <>{days}d </>}
        {pad(hours)}:{pad(mins)}:{pad(secs)}
      </div>
      <p className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest mt-2">
        Hasta el pitido inicial
      </p>
    </div>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
