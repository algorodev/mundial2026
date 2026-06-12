"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TeamBadge from "@/components/TeamBadge";

// ─── Tipos del subset de la API que renderizamos ────────────────────────

type LineupPlayer = {
  player: {
    id: number | null;
    name: string;
    number: number | null;
    pos: string | null;
    grid: string | null;
  };
};

type Lineup = {
  team: { id: number; name: string; logo: string };
  coach: { id: number | null; name: string | null; photo: string | null };
  formation: string | null;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
};

type MatchEvent = {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string; // "Goal" | "Card" | "subst" | "Var"
  detail: string;
  comments: string | null;
};

type H2HFixture = {
  fixture: { id: number; date: string };
  league: { name: string; round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
};

type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: T };

// ─── Componente principal ───────────────────────────────────────────────

export default function MatchDetailClient({
  matchId,
  homeTeam,
  awayTeam,
  homeCode,
  awayCode,
  homeFlag,
  awayFlag,
  homeLogoUrl,
  awayLogoUrl,
  homeApiTeamId,
  awayApiTeamId,
  hasApiFixture,
  kickoffAtIso,
}: {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeCode: string | null;
  awayCode: string | null;
  homeFlag: string | null;
  awayFlag: string | null;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  homeApiTeamId: number | null;
  awayApiTeamId: number | null;
  hasApiFixture: boolean;
  kickoffAtIso: string;
}) {
  const [lineups, setLineups] = useState<LoadState<Lineup[]>>({
    status: "idle",
  });
  const [events, setEvents] = useState<LoadState<MatchEvent[]>>({
    status: "idle",
  });
  const [h2h, setH2H] = useState<LoadState<H2HFixture[]>>({ status: "idle" });

  // Lineups y eventos sólo tienen sentido si tenemos apiFixtureId mapeado.
  useEffect(() => {
    if (!hasApiFixture) return;
    let cancelled = false;
    setLineups({ status: "loading" });
    fetch(`/api/match/${matchId}/lineups`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setLineups({ status: "error", error: d.error ?? "Error" });
          return;
        }
        setLineups({ status: "ok", data: d.lineups ?? [] });
      })
      .catch((e) => {
        if (!cancelled) setLineups({ status: "error", error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [matchId, hasApiFixture]);

  useEffect(() => {
    if (!hasApiFixture) return;
    let cancelled = false;
    setEvents({ status: "loading" });
    fetch(`/api/match/${matchId}/events`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setEvents({ status: "error", error: d.error ?? "Error" });
          return;
        }
        setEvents({ status: "ok", data: d.events ?? [] });
      })
      .catch((e) => {
        if (!cancelled) setEvents({ status: "error", error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [matchId, hasApiFixture]);

  useEffect(() => {
    let cancelled = false;
    setH2H({ status: "loading" });
    fetch(`/api/match/${matchId}/h2h`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setH2H({ status: "error", error: d.error ?? "Error" });
          return;
        }
        setH2H({ status: "ok", data: d.h2h ?? [] });
      })
      .catch((e) => {
        if (!cancelled) setH2H({ status: "error", error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  if (!hasApiFixture) {
    return (
      <NoApiBanner kickoffAtIso={kickoffAtIso} />
    );
  }

  return (
    <div className="space-y-6">
      <LineupsSection
        state={lineups}
        homeName={homeTeam}
        awayName={awayTeam}
        homeCode={homeCode}
        awayCode={awayCode}
        homeFlag={homeFlag}
        awayFlag={awayFlag}
        homeLogoUrl={homeLogoUrl}
        awayLogoUrl={awayLogoUrl}
      />
      <EventsSection state={events} homeName={homeTeam} awayName={awayTeam} />
      <H2HSection
        state={h2h}
        homeName={homeTeam}
        awayName={awayTeam}
        homeApiTeamId={homeApiTeamId}
        awayApiTeamId={awayApiTeamId}
      />
    </div>
  );
}

// ─── Subsecciones ────────────────────────────────────────────────────────

function SectionShell({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="cromo bg-paper-50 text-pitch-950 p-5 sm:p-6">
      <h2 className="font-display text-2xl sm:text-3xl mb-4 uppercase tracking-tight">
        {title}
      </h2>
      {empty ? (
        <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-500 text-center py-6">
          Sin datos disponibles
        </p>
      ) : (
        children
      )}
    </section>
  );
}

function StateMessage({ s }: { s: LoadState<unknown> }) {
  if (s.status === "loading")
    return (
      <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-500 text-center py-6">
        Cargando…
      </p>
    );
  if (s.status === "error")
    return (
      <p className="font-mono text-[11px] uppercase tracking-widest text-brick-500 text-center py-6">
        Error: {s.error}
      </p>
    );
  return null;
}

function NoApiBanner({ kickoffAtIso }: { kickoffAtIso: string }) {
  const ko = new Date(kickoffAtIso);
  const inFuture = ko.getTime() > Date.now();
  return (
    <div className="cromo bg-paper-50 text-pitch-950 p-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-widest text-pitch-700">
        {inFuture
          ? "Este partido todavía no está sincronizado con la API. Vuelve cerca del kickoff para ver alineaciones, eventos y H2H."
          : "Sin datos sincronizados para este partido."}
      </p>
    </div>
  );
}

function LineupsSection({
  state,
  homeName,
  awayName,
  homeCode,
  awayCode,
  homeFlag,
  awayFlag,
  homeLogoUrl,
  awayLogoUrl,
}: {
  state: LoadState<Lineup[]>;
  homeName: string;
  awayName: string;
  homeCode: string | null;
  awayCode: string | null;
  homeFlag: string | null;
  awayFlag: string | null;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
}) {
  return (
    <SectionShell
      title="Alineaciones"
      empty={state.status === "ok" && state.data.length === 0}
    >
      {state.status !== "ok" ? (
        <StateMessage s={state} />
      ) : state.data.length === 0 ? null : (
        <div className="grid sm:grid-cols-2 gap-5">
          {state.data.map((lu) => {
            // Casamos cada lineup a "home" o "away" por nombre. Si no encaja,
            // mostramos como viene de la API.
            const isHome = lu.team.name === homeName;
            const isAway = lu.team.name === awayName;
            const code = isHome ? homeCode : isAway ? awayCode : null;
            const flag = isHome ? homeFlag : isAway ? awayFlag : null;
            // Preferimos el logo que viene en la propia respuesta de
            // /lineups (lu.team.logo) si existe — es del mismo equipo y
            // siempre lo trae la API. Caemos a los nuestros si no.
            const logoUrl =
              lu.team.logo ??
              (isHome ? homeLogoUrl : isAway ? awayLogoUrl : null);
            return (
              <div key={lu.team.id} className="space-y-3">
                <div className="flex items-center gap-3 border-b-2 border-pitch-200 pb-2">
                  <TeamBadge
                    code={code}
                    flag={flag}
                    logoUrl={logoUrl}
                    alt={lu.team.name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="font-display uppercase text-base truncate">
                      {lu.team.name}
                    </div>
                    {lu.formation && (
                      <div className="font-mono text-[10px] uppercase tracking-widest text-pitch-600">
                        Formación {lu.formation}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-widest text-pitch-500 mb-1">
                    XI titular
                  </h3>
                  <ul className="text-sm font-mono space-y-0.5">
                    {lu.startXI.map((p, i) => (
                      <li
                        key={`s-${i}`}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <span className="text-pitch-500 w-6 text-right tabular-nums shrink-0">
                          {p.player.number ?? "—"}
                        </span>
                        <span className="truncate min-w-0 flex-1">
                          {p.player.name}
                        </span>
                        {p.player.pos && (
                          <span className="text-[10px] uppercase tracking-widest text-pitch-500 shrink-0 px-1.5 bg-pitch-100 rounded-sm">
                            {p.player.pos}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {lu.substitutes.length > 0 && (
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-pitch-500 mb-1">
                      Suplentes
                    </h3>
                    <ul className="text-sm font-mono space-y-0.5 text-pitch-700">
                      {lu.substitutes.map((p, i) => (
                        <li
                          key={`b-${i}`}
                          className="flex items-center gap-2 min-w-0"
                        >
                          <span className="text-pitch-400 w-6 text-right tabular-nums shrink-0">
                            {p.player.number ?? "—"}
                          </span>
                          <span className="truncate min-w-0 flex-1">
                            {p.player.name}
                          </span>
                          {p.player.pos && (
                            <span className="text-[10px] uppercase tracking-widest text-pitch-400 shrink-0">
                              {p.player.pos}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lu.coach.name && (
                  <p className="font-mono text-[10px] uppercase tracking-widest text-pitch-500">
                    Entrenador · {lu.coach.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

function EventsSection({
  state,
  homeName,
  awayName,
}: {
  state: LoadState<MatchEvent[]>;
  homeName: string;
  awayName: string;
}) {
  return (
    <SectionShell
      title="Eventos"
      empty={state.status === "ok" && state.data.length === 0}
    >
      {state.status !== "ok" ? (
        <StateMessage s={state} />
      ) : state.data.length === 0 ? null : (
        <ul className="space-y-1.5">
          {state.data.map((e, i) => {
            const isHome = e.team.name === homeName;
            const isAway = e.team.name === awayName;
            return (
              <li
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-3 items-center text-sm"
              >
                <div className="text-right font-mono min-w-0">
                  {isHome ? (
                    <EventLabel ev={e} side="home" />
                  ) : !isAway ? (
                    <span className="text-pitch-500 italic text-xs truncate inline-block max-w-full align-middle">
                      {e.team.name}
                    </span>
                  ) : null}
                </div>
                <span className="font-mono text-xs text-pitch-600 tabular-nums px-2 py-0.5 bg-pitch-100 rounded-sm whitespace-nowrap shrink-0">
                  {e.time.elapsed}
                  {e.time.extra ? `+${e.time.extra}` : ""}'
                </span>
                <div className="text-left font-mono min-w-0">
                  {isAway && <EventLabel ev={e} side="away" />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionShell>
  );
}

function EventLabel({ ev, side }: { ev: MatchEvent; side: "home" | "away" }) {
  const icon = iconFor(ev);
  const playerName = ev.player.name ?? "—";
  const tag =
    ev.type === "Goal" && ev.detail === "Penalty"
      ? " (P)"
      : ev.type === "Goal" && ev.detail === "Own Goal"
        ? " (EN P)"
        : "";
  // Para mantener el icono pegado al nombre incluso cuando trunca, usamos
  // un flex con el icono shrink-0 y el bloque del nombre con truncate.
  const dir = side === "home" ? "flex-row-reverse text-right" : "flex-row text-left";
  return (
    <span className={`flex items-baseline gap-1 min-w-0 ${dir}`}>
      <span className="shrink-0">{icon}</span>
      <span className="truncate min-w-0">
        {playerName}
        {tag && <span className="text-brick-500">{tag}</span>}
        {ev.type === "subst" && ev.assist?.name && (
          <span className="text-pitch-500"> ← {ev.assist.name}</span>
        )}
      </span>
    </span>
  );
}

function iconFor(ev: MatchEvent): string {
  if (ev.type === "Goal") return ev.detail === "Missed Penalty" ? "❌" : "⚽";
  if (ev.type === "Card") {
    if (ev.detail.includes("Red")) return "🟥";
    if (ev.detail.includes("Yellow")) return "🟨";
    return "🟨";
  }
  if (ev.type === "subst") return "🔄";
  if (ev.type === "Var") return "📺";
  return "•";
}

function H2HSection({
  state,
  homeName,
  awayName,
  homeApiTeamId,
  awayApiTeamId,
}: {
  state: LoadState<H2HFixture[]>;
  homeName: string;
  awayName: string;
  homeApiTeamId: number | null;
  awayApiTeamId: number | null;
}) {
  // Stats simples sobre los últimos N.
  const stats =
    state.status === "ok"
      ? (() => {
          let homeWins = 0;
          let awayWins = 0;
          let draws = 0;
          for (const f of state.data) {
            const hg = f.goals.home;
            const ag = f.goals.away;
            if (hg === null || ag === null) continue;
            // Preferimos comparar por apiTeamId (fiable). Fallback a nombre
            // por si el ID no está mapeado aún.
            const homeIsOurs = homeApiTeamId
              ? f.teams.home.id === homeApiTeamId
              : f.teams.home.name === homeName;
            const awayIsOurs = homeApiTeamId
              ? f.teams.away.id === homeApiTeamId
              : f.teams.away.name === homeName;
            const ourScore = homeIsOurs ? hg : awayIsOurs ? ag : null;
            const theirScore = homeIsOurs ? ag : awayIsOurs ? hg : null;
            if (ourScore === null || theirScore === null) continue;
            if (ourScore > theirScore) homeWins++;
            else if (ourScore < theirScore) awayWins++;
            else draws++;
          }
          return { homeWins, awayWins, draws };
        })()
      : null;

  return (
    <SectionShell
      title="Historial (H2H)"
      empty={state.status === "ok" && state.data.length === 0}
    >
      {state.status !== "ok" ? (
        <StateMessage s={state} />
      ) : state.data.length === 0 ? null : (
        <>
          {stats && (
            <div className="grid grid-cols-3 gap-2 mb-4 text-center font-mono">
              <div className="bg-grass-100 text-grass-800 py-2 px-1 cromo-sm">
                <div className="font-display text-2xl tabular-nums">
                  {stats.homeWins}
                </div>
                <div className="text-[10px] uppercase tracking-widest mt-0.5 truncate">
                  {homeName} gana
                </div>
              </div>
              <div className="bg-pitch-100 text-pitch-700 py-2 px-1 cromo-sm">
                <div className="font-display text-2xl tabular-nums">
                  {stats.draws}
                </div>
                <div className="text-[10px] uppercase tracking-widest mt-0.5">
                  Empates
                </div>
              </div>
              <div className="bg-grass-100 text-grass-800 py-2 px-1 cromo-sm">
                <div className="font-display text-2xl tabular-nums">
                  {stats.awayWins}
                </div>
                <div className="text-[10px] uppercase tracking-widest mt-0.5 truncate">
                  {awayName} gana
                </div>
              </div>
            </div>
          )}
          <ul className="divide-y divide-pitch-200">
            {state.data.map((f) => (
              <li key={f.fixture.id} className="py-2.5">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-pitch-500 mb-1.5 min-w-0">
                  <span className="shrink-0">
                    {new Date(f.fixture.date).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                  <span className="shrink-0">·</span>
                  <span className="truncate min-w-0">{f.league.name}</span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-3 items-center text-sm">
                  <div className="flex items-center justify-end gap-1.5 min-w-0">
                    <span className="truncate min-w-0 font-display uppercase text-xs sm:text-sm tracking-tight">
                      {f.teams.home.name}
                    </span>
                    {f.teams.home.logo && (
                      <Image
                        src={f.teams.home.logo}
                        alt=""
                        width={18}
                        height={18}
                        className="inline-block shrink-0"
                        unoptimized
                      />
                    )}
                  </div>
                  <span className="font-display tabular-nums whitespace-nowrap px-2 text-base">
                    {f.goals.home ?? "—"}
                    <span className="text-pitch-400 mx-1">·</span>
                    {f.goals.away ?? "—"}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {f.teams.away.logo && (
                      <Image
                        src={f.teams.away.logo}
                        alt=""
                        width={18}
                        height={18}
                        className="inline-block shrink-0"
                        unoptimized
                      />
                    )}
                    <span className="truncate min-w-0 font-display uppercase text-xs sm:text-sm tracking-tight">
                      {f.teams.away.name}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionShell>
  );
}
