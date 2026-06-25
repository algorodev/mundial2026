import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, eq, or, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams, tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getGroupForMember } from "@/lib/group-access";
import { getTeamById, getSquad, type ApiSquadPlayer } from "@/lib/api-football";
import TeamBadge from "@/components/TeamBadge";
import BackLink from "@/components/BackLink";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

const TEAM_META_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const TEAM_SQUAD_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export default async function TeamDetailPage(props: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code: rawCode } = await props.params;
  const code = rawCode.toUpperCase();

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/g/${slug}/team/${rawCode}`)}`);
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  const ctx = await getGroupForMember(slug, session.userId);
  if (!ctx) notFound();

  const [team, tournament, allTeams, teamMatches] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(and(eq(teams.tournamentId, ctx.tournamentId), eq(teams.code, code)))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, ctx.tournamentId))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(teams)
      .where(eq(teams.tournamentId, ctx.tournamentId)),
    db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.tournamentId, ctx.tournamentId),
          or(eq(matches.homeCode, code), eq(matches.awayCode, code))
        )
      )
      .orderBy(asc(matches.matchNumber)),
  ]);
  if (!team) notFound();

  const teamByCode: Record<
    string,
    { name: string; flagEmoji: string | null; logoUrl: string | null }
  > = {};
  for (const tm of allTeams) {
    teamByCode[tm.code] = { name: tm.name, flagEmoji: tm.flagEmoji, logoUrl: tm.logoUrl };
  }

  const record = teamMatches.reduce(
    (acc, m) => {
      if (m.homeScore === null || m.awayScore === null) return acc;
      const isHome = m.homeCode === code;
      const own = isHome ? m.homeScore : m.awayScore;
      const opp = isHome ? m.awayScore : m.homeScore;
      acc.played++;
      acc.goalsFor += own;
      acc.goalsAgainst += opp;
      if (own > opp) acc.win++;
      else if (own === opp) acc.draw++;
      else acc.lose++;
      return acc;
    },
    { played: 0, win: 0, draw: 0, lose: 0, goalsFor: 0, goalsAgainst: 0 }
  );

  // Forma cronológica: W/D/L de los partidos ya jugados (más antiguo primero)
  const form = teamMatches
    .filter((m) => m.homeScore !== null && m.awayScore !== null)
    .map((m): "W" | "D" | "L" => {
      const isHome = m.homeCode === code;
      const own = isHome ? m.homeScore! : m.awayScore!;
      const opp = isHome ? m.awayScore! : m.homeScore!;
      return own > opp ? "W" : own < opp ? "L" : "D";
    });

  // Metadatos (país, fundación, estadio) y plantilla: cache en DB.
  // metaFreshAt controla si ya se intentó la llamada (no si tiene datos).
  type TeamMeta = {
    country: string | null;
    founded: number | null;
    venueName: string | null;
    venueCity: string | null;
    venueCapacity: number | null;
  };

  const now = Date.now();
  const metaFresh =
    !!team.metaFetchedAt &&
    now - team.metaFetchedAt.getTime() < TEAM_META_MAX_AGE_MS;
  const squadFresh =
    !!team.squadFetchedAt &&
    now - team.squadFetchedAt.getTime() < TEAM_SQUAD_MAX_AGE_MS;

  let teamMeta: TeamMeta | null = null;
  let squad: ApiSquadPlayer[] | null = null;

  if (team.apiTeamId) {
    // --- Meta ---
    if (metaFresh) {
      // Servir desde DB aunque todos los campos sean null (evita refetch continuo).
      if (team.country || team.founded || team.venueName) {
        teamMeta = {
          country: team.country ?? null,
          founded: team.founded ?? null,
          venueName: team.venueName ?? null,
          venueCity: team.venueCity ?? null,
          venueCapacity: team.venueCapacity ?? null,
        };
      }
    } else {
      try {
        const [info] = await getTeamById(team.apiTeamId);
        if (info) {
          teamMeta = {
            country: info.team.country ?? null,
            founded: info.team.founded ?? null,
            venueName: info.venue.name ?? null,
            venueCity: info.venue.city ?? null,
            venueCapacity: info.venue.capacity ?? null,
          };
          await db.update(teams).set({
            country: teamMeta.country,
            founded: teamMeta.founded,
            venueName: teamMeta.venueName,
            venueCity: teamMeta.venueCity,
            venueCapacity: teamMeta.venueCapacity,
            metaFetchedAt: new Date(),
          }).where(eq(teams.id, team.id));
        }
      } catch { /* Silenciamos: la página sigue con datos propios. */ }
    }

    // --- Plantilla ---
    if (squadFresh && team.squadJson) {
      try { squad = JSON.parse(team.squadJson) as ApiSquadPlayer[]; } catch { /* ignore */ }
    } else if (!squadFresh) {
      try {
        const [res] = await getSquad(team.apiTeamId);
        if (res?.players?.length) {
          squad = res.players;
          await db.update(teams).set({
            squadJson: JSON.stringify(squad),
            squadFetchedAt: new Date(),
          }).where(eq(teams.id, team.id));
        }
      } catch { /* Silenciamos: sin plantilla. */ }
    }
  }

  return (
    <div className="pt-8">
      <BackLink href={`/g/${slug}`} className="mb-3">
        {ctx.name}
      </BackLink>

      <div className="cromo bg-paper-50 text-pitch-950 p-6 sm:p-8 mb-6 text-center">
        <div className="flex justify-center mb-3">
          <TeamBadge
            code={team.code}
            flag={team.flagEmoji}
            logoUrl={team.logoUrl}
            alt={team.name}
            size="lg"
          />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight">
          {team.name}
        </h1>
        {tournament && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-pitch-500">
            {tournament.name}
          </p>
        )}
        {teamMeta ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-mono uppercase tracking-widest text-pitch-700 border-t-2 border-dashed border-pitch-950/20 pt-4">
            {teamMeta.country && (
              <span>
                {t.teamDetail.country}: {teamMeta.country}
              </span>
            )}
            {teamMeta.founded && (
              <span>{t.teamDetail.founded.replace("{year}", String(teamMeta.founded))}</span>
            )}
            {teamMeta.venueName && (
              <span>
                {t.teamDetail.venue}: {teamMeta.venueName}
                {teamMeta.venueCity ? ` (${teamMeta.venueCity})` : ""}
              </span>
            )}
            {teamMeta.venueCapacity && (
              <span>{t.teamDetail.capacity.replace("{capacity}", teamMeta.venueCapacity.toLocaleString(locale))}</span>
            )}
          </div>
        ) : (
          <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-pitch-400 border-t-2 border-dashed border-pitch-950/20 pt-4">
            {t.teamDetail.noApiData}
          </p>
        )}
      </div>

      <h2 className="mb-4 flex items-center gap-3">
        <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
        <span className="bg-flame-500 text-pitch-950 font-display text-lg px-4 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
          {t.teamDetail.record}
        </span>
        <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
      </h2>
      <div className="cromo bg-paper-50 text-pitch-950 p-5 mb-8">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 text-center">
          <RecordStat label={t.standings.played} value={record.played} />
          <RecordStat label={t.standings.wins} value={record.win} />
          <RecordStat label={t.standings.draws} value={record.draw} />
          <RecordStat label={t.standings.losses} value={record.lose} />
          <RecordStat label={t.standings.goalsFor} value={record.goalsFor} />
          <RecordStat label={t.standings.goalsAgainst} value={record.goalsAgainst} />
          <RecordStat
            label={t.standings.goalDiff}
            value={record.goalsFor - record.goalsAgainst}
            valueStr={
              record.goalsFor - record.goalsAgainst > 0
                ? `+${record.goalsFor - record.goalsAgainst}`
                : String(record.goalsFor - record.goalsAgainst)
            }
          />
        </div>
        {form.length > 0 && (
          <div className="mt-4 pt-4 border-t-2 border-dashed border-pitch-950/20 flex items-center gap-4 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-pitch-500 shrink-0">
              {t.teamDetail.form}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {form.map((r, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 flex items-center justify-center text-[11px] font-display font-bold border-2 border-pitch-950 ${
                    r === "W"
                      ? "bg-grass-500 text-white"
                      : r === "L"
                      ? "bg-brick-500 text-white"
                      : "bg-pitch-200 text-pitch-700"
                  }`}
                >
                  {r === "W"
                    ? t.standings.wins
                    : r === "L"
                    ? t.standings.losses
                    : t.standings.draws}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="mb-5 flex items-center gap-3">
        <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
        <span className="bg-flame-500 text-pitch-950 font-display text-lg px-4 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
          {t.teamDetail.fixtures}
        </span>
        <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {teamMatches.map((m) => {
          const homeInfo = m.homeCode ? teamByCode[m.homeCode] : undefined;
          const awayInfo = m.awayCode ? teamByCode[m.awayCode] : undefined;
          const hasResult = m.homeScore !== null && m.awayScore !== null;
          const isHome = m.homeCode === code;
          const result: "W" | "D" | "L" | null = hasResult
            ? (() => {
                const own = isHome ? m.homeScore! : m.awayScore!;
                const opp = isHome ? m.awayScore! : m.homeScore!;
                return own > opp ? "W" : own < opp ? "L" : "D";
              })()
            : null;
          const cardBg =
            result === "W"
              ? "bg-grass-50"
              : result === "L"
              ? "bg-brick-50"
              : "bg-paper-50";
          return (
            <article key={m.id} className={`cromo-sm ${cardBg} text-pitch-950 p-4`}>
              {/* Meta: grupo + fecha + badge resultado */}
              <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-mono uppercase tracking-widest text-pitch-700">
                <div className="flex items-center gap-2 min-w-0">
                  {m.groupName && (
                    <span className={`group-${m.groupName} px-2 py-0.5 rounded-sm shrink-0`}>
                      {t.predictions.group.replace("{name}", m.groupName)}
                    </span>
                  )}
                  <span className="shrink-0">{m.matchDate}</span>
                  {!hasResult && m.matchTime && (
                    <span className="shrink-0">· {m.matchTime}</span>
                  )}
                </div>
                {result && (
                  <span
                    className={`shrink-0 font-display text-[10px] px-2 py-0.5 border-2 border-pitch-950 ${
                      result === "W"
                        ? "bg-grass-500 text-white"
                        : result === "L"
                        ? "bg-brick-500 text-white"
                        : "bg-pitch-200 text-pitch-700"
                    }`}
                  >
                    {result === "W"
                      ? t.standings.wins
                      : result === "L"
                      ? t.standings.losses
                      : t.standings.draws}
                  </span>
                )}
              </div>
              {/* Estadio */}
              {m.stadium && (
                <p className="text-[9px] font-mono text-pitch-500 uppercase tracking-widest mb-3">
                  {m.stadium}
                </p>
              )}
              {!m.stadium && <div className="mb-2" />}
              {/* Equipos + marcador */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 items-center">
                <div className="text-right min-w-0">
                  <div className="flex justify-end mb-1">
                    <TeamBadge
                      code={m.homeCode}
                      flag={m.homeFlag}
                      logoUrl={homeInfo?.logoUrl ?? null}
                      alt={m.homeTeam}
                      size="sm"
                    />
                  </div>
                  <div
                    className={`font-display uppercase text-xs leading-tight tracking-tight truncate ${
                      hasResult && !isHome && result === "L" ? "text-pitch-400" : ""
                    } ${hasResult && isHome && result === "W" ? "font-bold" : ""}`}
                  >
                    {m.homeTeam}
                  </div>
                </div>
                <div className="font-display text-xl px-1 whitespace-nowrap tabular-nums shrink-0">
                  {hasResult ? (
                    <>
                      {m.homeScore}
                      <span className="text-brick-500 mx-1">·</span>
                      {m.awayScore}
                    </>
                  ) : (
                    <span className="text-pitch-400">{t.teamDetail.pendingVs}</span>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="flex justify-start mb-1">
                    <TeamBadge
                      code={m.awayCode}
                      flag={m.awayFlag}
                      logoUrl={awayInfo?.logoUrl ?? null}
                      alt={m.awayTeam}
                      size="sm"
                    />
                  </div>
                  <div
                    className={`font-display uppercase text-xs leading-tight tracking-tight truncate ${
                      hasResult && isHome && result === "L" ? "text-pitch-400" : ""
                    } ${hasResult && !isHome && result === "W" ? "font-bold" : ""}`}
                  >
                    {m.awayTeam}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-right">
                <Link
                  href={`/g/${slug}/m/${m.matchNumber}`}
                  className="inline-block font-mono text-[10px] uppercase tracking-widest text-pitch-700 hover:text-flame-600 whitespace-nowrap"
                >
                  {t.predictions.matchDetail}
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Plantilla */}
      {squad && squad.length > 0 && (
        <>
          <h2 className="mt-10 mb-5 flex items-center gap-3">
            <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
            <span className="bg-flame-500 text-pitch-950 font-display text-lg px-4 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
              {t.teamDetail.squad}
            </span>
            <span className="h-1 flex-1 bg-paper-200 dark:bg-pitch-800" />
          </h2>
          <SquadSection squad={squad} t={t.teamDetail} />
        </>
      )}
    </div>
  );
}

const POSITION_ORDER = ["Goalkeeper", "Defender", "Midfielder", "Attacker"] as const;
type PosKey = (typeof POSITION_ORDER)[number];

function posLabel(pos: PosKey, t: { posGoalkeeper: string; posDefender: string; posMidfielder: string; posAttacker: string }) {
  return pos === "Goalkeeper" ? t.posGoalkeeper
    : pos === "Defender" ? t.posDefender
    : pos === "Midfielder" ? t.posMidfielder
    : t.posAttacker;
}

function SquadSection({ squad, t }: {
  squad: ApiSquadPlayer[];
  t: { posGoalkeeper: string; posDefender: string; posMidfielder: string; posAttacker: string };
}) {
  const byPos = new Map<PosKey, ApiSquadPlayer[]>();
  for (const pos of POSITION_ORDER) byPos.set(pos, []);
  for (const p of squad) {
    const key = POSITION_ORDER.find((k) => k === p.position) ?? "Attacker";
    byPos.get(key)!.push(p);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
      {POSITION_ORDER.map((pos) => {
        const players = byPos.get(pos)!;
        if (players.length === 0) return null;
        return (
          <div key={pos} className="cromo-sm bg-paper-50 text-pitch-950 p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-pitch-500 mb-3 border-b-2 border-dashed border-pitch-950/15 pb-2">
              {posLabel(pos, t)}
            </div>
            <ul className="space-y-1.5">
              {players
                .sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
                .map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="font-display text-[11px] w-5 text-right text-pitch-400 shrink-0">
                      {p.number ?? "—"}
                    </span>
                    <span className="flex-1 font-display text-[13px] uppercase tracking-tight leading-tight truncate">
                      {p.name}
                    </span>
                    {p.age != null && (
                      <span className="font-mono text-[10px] text-pitch-400 shrink-0">
                        {p.age}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function RecordStat({ label, value, valueStr }: { label: string; value: number; valueStr?: string }) {
  return (
    <div>
      <div className="font-display text-3xl sm:text-4xl leading-none">{valueStr ?? value}</div>
      <div className="font-mono text-[9px] text-pitch-500 uppercase tracking-widest mt-1.5">
        {label}
      </div>
    </div>
  );
}
