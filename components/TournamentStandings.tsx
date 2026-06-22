"use client";

import { useEffect, useState } from "react";
import StandingsView, { type StandingRow } from "@/components/StandingsView";
import { useI18n } from "@/providers/I18nProvider";

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
  groupSlug,
  teamCodeByApiId,
}: {
  tournamentSlug: string;
  // Si se pasan junto con groupSlug, cada equipo de la tabla enlaza a su
  // página de detalle dentro de la porra.
  groupSlug?: string;
  teamCodeByApiId?: Record<number, string>;
}) {
  const { t } = useI18n();
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
      <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-500 dark:text-chalk-400 text-center py-10">
        {t.standings.loading}
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <div className="cromo bg-paper-50 text-pitch-950 p-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-brick-500">
          {t.common.error}: {state.error}
        </p>
      </div>
    );
  }

  const groups = state.data[0]?.league.standings ?? [];
  const teamHref =
    groupSlug && teamCodeByApiId
      ? (apiTeamId: number) => {
          const code = teamCodeByApiId[apiTeamId];
          return code ? `/g/${groupSlug}/team/${code}` : null;
        }
      : undefined;
  return (
    <StandingsView
      groups={groups}
      teamHref={teamHref}
      translations={{
        noData: t.standings.noData,
        rank: t.standings.rank,
        team: t.standings.team,
        played: t.standings.played,
        wins: t.standings.wins,
        draws: t.standings.draws,
        losses: t.standings.losses,
        goalsFor: t.standings.goalsFor,
        goalsAgainst: t.standings.goalsAgainst,
        goalDiff: t.standings.goalDiff,
        points: t.standings.points,
        group: t.standings.group,
      }}
    />
  );
}
