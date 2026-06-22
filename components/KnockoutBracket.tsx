// Cuadro de eliminatoria: una columna por ronda, con scroll horizontal.
// Puramente de presentación (sin hooks) para poder usarse desde un server
// component, igual que StandingsView.

import Link from "next/link";
import TeamBadge from "@/components/TeamBadge";

export type BracketMatch = {
  matchNumber: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string | null;
  awayCode: string | null;
  homeFlag: string | null;
  awayFlag: string | null;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type BracketRound = {
  key: string;
  label: string;
  matches: BracketMatch[];
};

export default function KnockoutBracket({
  groupSlug,
  rounds,
  title,
}: {
  groupSlug: string;
  rounds: BracketRound[];
  title: string;
}) {
  if (rounds.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-display text-xl uppercase mb-3 text-pitch-900 dark:text-chalk-50">
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {rounds.map((round) => (
          <div key={round.key} className="shrink-0 w-[220px] sm:w-[240px]">
            <h3 className="font-display text-xs uppercase tracking-widest text-center mb-2 text-pitch-700 dark:text-flame-400">
              {round.label}
            </h3>
            <div className="space-y-2.5">
              {round.matches.map((m) => (
                <BracketCard key={m.matchNumber} groupSlug={groupSlug} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketCard({
  groupSlug,
  match,
}: {
  groupSlug: string;
  match: BracketMatch;
}) {
  const played = match.homeScore !== null && match.awayScore !== null;
  return (
    <Link
      href={`/g/${groupSlug}/m/${match.matchNumber}`}
      className="block cromo-sm bg-paper-50 text-pitch-950 p-2.5 hover:-translate-y-0.5 transition-transform"
    >
      <BracketSide
        team={match.homeTeam}
        code={match.homeCode}
        flag={match.homeFlag}
        logoUrl={match.homeLogoUrl}
        score={played ? match.homeScore : null}
        winner={played && match.homeScore! > match.awayScore!}
      />
      <BracketSide
        team={match.awayTeam}
        code={match.awayCode}
        flag={match.awayFlag}
        logoUrl={match.awayLogoUrl}
        score={played ? match.awayScore : null}
        winner={played && match.awayScore! > match.homeScore!}
      />
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-pitch-500 text-center">
        {match.date}
      </div>
    </Link>
  );
}

function BracketSide({
  team,
  code,
  flag,
  logoUrl,
  score,
  winner,
}: {
  team: string;
  code: string | null;
  flag: string | null;
  logoUrl: string | null;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <TeamBadge code={code} flag={flag} logoUrl={logoUrl} alt={team} size="sm" />
      <span
        className={`flex-1 min-w-0 truncate font-display uppercase text-[11px] leading-tight ${
          winner ? "text-pitch-950" : "text-pitch-600"
        }`}
      >
        {team}
      </span>
      {score !== null && (
        <span className="font-mono text-xs tabular-nums shrink-0">{score}</span>
      )}
    </div>
  );
}
