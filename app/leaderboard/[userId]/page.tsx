import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, predictions, users } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { getTournamentStartIso, getTournamentStartLabel } from "@/lib/matches-data";
import { calcPoints, type ScoreResult } from "@/lib/scoring";

export const dynamic = "force-dynamic";

type MatchRow = typeof matches.$inferSelect;

export default async function UserPredictionsPage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tournamentStartIso = getTournamentStartIso();
  if (Date.now() < new Date(tournamentStartIso).getTime()) {
    // Aún no ha empezado el Mundial: las predicciones ajenas son privadas.
    redirect("/leaderboard");
  }

  const userId = parseInt(params.userId, 10);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target || target.isAdmin === 1) notFound();

  const [allMatches, userPreds] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.matchNumber)),
    db.select().from(predictions).where(eq(predictions.userId, userId)),
  ]);

  const predMap = new Map<number, { homeScore: number; awayScore: number }>();
  for (const p of userPreds) {
    predMap.set(p.matchId, {
      homeScore: p.homeScore,
      awayScore: p.awayScore,
    });
  }

  // Stats
  let total = 0;
  let exact = 0;
  let outcome = 0;
  let miss = 0;
  let played = 0;
  for (const m of allMatches) {
    const p = predMap.get(m.id);
    if (!p) continue;
    if (m.homeScore == null || m.awayScore == null) continue;
    const { points, result } = calcPoints(
      p.homeScore,
      p.awayScore,
      m.homeScore,
      m.awayScore
    );
    total += points;
    played += 1;
    if (result === "exact") exact += 1;
    else if (result === "outcome") outcome += 1;
    else if (result === "miss") miss += 1;
  }

  // Agrupar por fecha respetando el orden de matchNumber
  const groupsByDate = new Map<string, MatchRow[]>();
  for (const m of allMatches) {
    const arr = groupsByDate.get(m.matchDate) ?? [];
    arr.push(m);
    groupsByDate.set(m.matchDate, arr);
  }

  const isSelf = target.name === session.name;

  return (
    <div className="pt-8">
      <div className="mb-8">
        <Link
          href="/leaderboard"
          className="inline-block font-mono text-[11px] uppercase tracking-widest text-chalk-400 hover:text-flame-400 transition-colors mb-4"
        >
          ← Volver a la clasificación
        </Link>
        <p className="font-mono text-[11px] uppercase tracking-widest text-chalk-400 mb-1">
          Pronósticos de
        </p>
        <h1 className="font-display text-5xl sm:text-7xl text-chalk-50 leading-none uppercase break-words">
          {target.name}
          {isSelf && (
            <span className="ml-4 align-middle inline-block bg-flame-500 text-pitch-950 font-display text-xs px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
              ← Tú
            </span>
          )}
        </h1>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-chalk-400">
          🔒 Bloqueadas desde el inicio del Mundial · {getTournamentStartLabel()}
        </p>
      </div>

      {/* Stats resumen */}
      <div className="cromo bg-pitch-900 p-5 sm:p-6 mb-10 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Stat label="Puntos" value={total} accent="text-flame-500" />
        <Stat label="Exactos" value={exact} accent="text-grass-400" />
        <Stat label="Signos" value={outcome} accent="text-flame-400" />
        <Stat label="Fallos" value={miss} accent="text-brick-400" />
        <Stat label="Jugados" value={played} accent="text-chalk-50" />
      </div>

      <div className="space-y-12">
        {Array.from(groupsByDate.entries()).map(([date, dayMatches]) => (
          <section key={date}>
            <h2 className="mb-5 flex items-center gap-3">
              <span className="h-1 flex-1 bg-pitch-800" />
              <span className="bg-flame-500 text-pitch-950 font-display text-xl px-4 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-wider -rotate-1 inline-block">
                {date}
              </span>
              <span className="h-1 flex-1 bg-pitch-800" />
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 px-1 py-2">
              {dayMatches.map((m, idx) => (
                <ReadOnlyMatchCard
                  key={m.id}
                  match={m}
                  pred={predMap.get(m.id)}
                  tilt={idx % 2 === 0 ? "even" : "odd"}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div>
      <div className={`font-display text-4xl sm:text-5xl leading-none ${accent}`}>
        {value}
      </div>
      <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest mt-2">
        {label}
      </div>
    </div>
  );
}

function ReadOnlyMatchCard({
  match,
  pred,
  tilt,
}: {
  match: MatchRow;
  pred: { homeScore: number; awayScore: number } | undefined;
  tilt: "even" | "odd";
}) {
  const hasResult = match.homeScore != null && match.awayScore != null;
  const hasPred = pred !== undefined;

  let cromoBg = "bg-paper-50";
  let pointsBadge: React.ReactNode = null;
  let result: ScoreResult = "pending";
  if (hasResult && hasPred) {
    const r = calcPoints(
      pred.homeScore,
      pred.awayScore,
      match.homeScore,
      match.awayScore
    );
    result = r.result;
    if (result === "exact") {
      cromoBg = "bg-grass-300";
      pointsBadge = (
        <span className="font-display text-[10px] bg-grass-600 text-paper-50 px-2 py-1 border-2 border-pitch-950 shadow-brutal-sm tracking-wider">
          +3 EXACTO
        </span>
      );
    } else if (result === "outcome") {
      cromoBg = "bg-flame-300";
      pointsBadge = (
        <span className="font-display text-[10px] bg-flame-500 text-pitch-950 px-2 py-1 border-2 border-pitch-950 shadow-brutal-sm tracking-wider">
          +1 SIGNO
        </span>
      );
    } else {
      cromoBg = "bg-paper-200";
      pointsBadge = (
        <span className="font-display text-[10px] bg-pitch-950 text-chalk-400 px-2 py-1 border-2 border-pitch-950 shadow-brutal-sm tracking-wider">
          +0
        </span>
      );
    }
  } else if (!hasPred) {
    cromoBg = "bg-paper-200";
  }

  const tiltClass = tilt === "even" ? "rotate-[-0.4deg]" : "rotate-[0.4deg]";

  return (
    <article
      className={`cromo ${cromoBg} text-pitch-950 ${tiltClass} p-4 sm:p-5 hover:rotate-0 hover:-translate-y-1 hover:shadow-brutal-lg transition-all`}
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`group-${match.groupName} text-[10px] px-2 py-0.5 rounded`}
          >
            GRUPO {match.groupName}
          </span>
          <span className="font-mono text-xs text-pitch-700 font-bold">
            {match.matchTime}
          </span>
          <span className="font-mono text-[10px] text-pitch-700/60 hidden sm:inline">
            · {match.stadium}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pointsBadge}
          {!hasPred && (
            <span className="font-display text-[10px] bg-pitch-950 text-brick-400 px-2 py-1 border-2 border-pitch-950 tracking-wider">
              SIN PRONÓSTICO
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <div className="text-right">
          <div className="text-3xl sm:text-4xl mb-1">{match.homeFlag}</div>
          <div className="font-display uppercase text-pitch-950 text-sm sm:text-base leading-tight tracking-tight">
            {match.homeTeam}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScoreBox value={hasPred ? pred!.homeScore : null} />
          <span className="text-pitch-950 font-display text-3xl">·</span>
          <ScoreBox value={hasPred ? pred!.awayScore : null} />
        </div>

        <div className="text-left">
          <div className="text-3xl sm:text-4xl mb-1">{match.awayFlag}</div>
          <div className="font-display uppercase text-pitch-950 text-sm sm:text-base leading-tight tracking-tight">
            {match.awayTeam}
          </div>
        </div>
      </div>

      {hasResult && (
        <div className="mt-4 pt-3 border-t-2 border-dashed border-pitch-950/30 text-center">
          <span className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest">
            Resultado real
          </span>
          <div className="font-display text-3xl text-pitch-950 mt-1">
            {match.homeScore} <span className="text-brick-500">·</span>{" "}
            {match.awayScore}
          </div>
        </div>
      )}
    </article>
  );
}

function ScoreBox({ value }: { value: number | null }) {
  return (
    <div className="w-14 h-14 flex items-center justify-center text-2xl font-display bg-paper-50 border-2 border-pitch-950 text-pitch-950 rounded-lg shadow-brutal-sm">
      {value == null ? (
        <span className="text-pitch-700/40">—</span>
      ) : (
        value
      )}
    </div>
  );
}
