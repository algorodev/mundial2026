"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Subset del payload de /api/tournaments/[slug]/standings que usamos aquí.
type StandingRow = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  description: string | null; // "Promotion - Round of 16", etc.
};

type StandingsLeague = {
  league: {
    id: number;
    name: string;
    season: number;
    standings: StandingRow[][];
  };
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: StandingsLeague[] };

export default function TournamentStandings({
  tournamentSlug,
}: {
  tournamentSlug: string;
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tournaments/${tournamentSlug}/standings`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setState({ status: "error", error: d.error ?? "Error" });
          return;
        }
        setState({ status: "ok", data: d.standings ?? [] });
      })
      .catch((e) => {
        if (!cancelled) setState({ status: "error", error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentSlug]);

  if (state.status === "loading") {
    return (
      <p className="font-mono text-[11px] uppercase tracking-widest text-chalk-400 text-center py-10">
        Cargando clasificación…
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <div className="cromo bg-paper-50 text-pitch-950 p-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-brick-500">
          Error: {state.error}
        </p>
      </div>
    );
  }

  const league = state.data[0];
  const groups = league?.league.standings ?? [];

  if (groups.length === 0) {
    return (
      <div className="cromo bg-paper-50 text-pitch-950 p-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-500">
          Sin datos de clasificación todavía
        </p>
      </div>
    );
  }

  // Si hay un solo grupo, una tabla simple. Si hay varios (Mundial),
  // cards por grupo en grid responsivo.
  if (groups.length === 1) {
    return <StandingsTable rows={groups[0]} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {groups.map((rows, i) => (
        <div key={i} className="cromo bg-paper-50 text-pitch-950 p-4">
          <h3 className="font-display text-xl uppercase mb-3 text-center">
            {extractGroupLabel(rows[0]?.group) ?? `Grupo ${i + 1}`}
          </h3>
          <StandingsTable rows={rows} compact />
        </div>
      ))}
    </div>
  );
}

// La API devuelve cosas tipo "Group A · World Cup 2026" — nos quedamos
// con el "Group A" para no llenar el header de basura.
function extractGroupLabel(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/group\s+[A-Z0-9]+/i);
  return m ? m[0].toUpperCase() : raw;
}

function StandingsTable({
  rows,
  compact = false,
}: {
  rows: StandingRow[];
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact ? "" : "cromo bg-paper-50 text-pitch-950 p-3 sm:p-5"
      }
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-mono uppercase tracking-widest text-pitch-500 border-b-2 border-pitch-200">
            <th className="text-left py-1.5 pl-1 w-6">#</th>
            <th className="text-left py-1.5">Equipo</th>
            <th className="text-center py-1.5 w-7 tabular-nums">PJ</th>
            {!compact && (
              <>
                <th className="text-center py-1.5 w-7 tabular-nums">G</th>
                <th className="text-center py-1.5 w-7 tabular-nums">E</th>
                <th className="text-center py-1.5 w-7 tabular-nums">P</th>
                <th className="text-center py-1.5 w-10 tabular-nums">GF</th>
                <th className="text-center py-1.5 w-10 tabular-nums">GC</th>
              </>
            )}
            <th className="text-center py-1.5 w-8 tabular-nums">DG</th>
            <th className="text-right py-1.5 pr-1 w-9 tabular-nums">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.team.id}
              className="border-b border-pitch-100 last:border-0"
            >
              <td className="py-2 pl-1 text-pitch-500 font-mono tabular-nums">
                {r.rank}
              </td>
              <td className="py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {r.team.logo && (
                    <Image
                      src={r.team.logo}
                      alt=""
                      width={18}
                      height={18}
                      className="inline-block shrink-0"
                      unoptimized
                    />
                  )}
                  <span className="font-display uppercase text-xs sm:text-sm truncate">
                    {r.team.name}
                  </span>
                </div>
              </td>
              <td className="py-2 text-center font-mono tabular-nums">
                {r.all.played}
              </td>
              {!compact && (
                <>
                  <td className="py-2 text-center font-mono tabular-nums">
                    {r.all.win}
                  </td>
                  <td className="py-2 text-center font-mono tabular-nums">
                    {r.all.draw}
                  </td>
                  <td className="py-2 text-center font-mono tabular-nums">
                    {r.all.lose}
                  </td>
                  <td className="py-2 text-center font-mono tabular-nums">
                    {r.all.goals.for}
                  </td>
                  <td className="py-2 text-center font-mono tabular-nums">
                    {r.all.goals.against}
                  </td>
                </>
              )}
              <td className="py-2 text-center font-mono tabular-nums text-pitch-600">
                {r.goalsDiff > 0 && "+"}
                {r.goalsDiff}
              </td>
              <td className="py-2 pr-1 text-right font-display tabular-nums text-base">
                {r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
