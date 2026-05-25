"use client";

import { useEffect, useState } from "react";
import StandingsView, { type StandingRow } from "@/components/StandingsView";

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

  const groups = state.data[0]?.league.standings ?? [];
  return <StandingsView groups={groups} />;
}
