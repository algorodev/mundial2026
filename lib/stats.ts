// Estadísticas "de la porra" (no del torneo real): máximo acertante, racha
// de exactos y mejor jornada, calculadas sobre predictions + resultados.
// Mismo patrón de datos que getLeaderboardData en app/api/leaderboard/route.ts
// (matches + predictions del grupo), ampliado con la cronología
// (matchNumber/kickoffAt/matchDate/groupName) necesaria para ordenar por
// fecha y agrupar por jornada.

import { db } from "@/lib/db";
import { matches, predictions, groupMembers, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { calcPoints } from "@/lib/scoring";
import { ROUND_PHASE_LABELS } from "@/lib/knockout-phases";

type RoundPhaseLabel = (typeof ROUND_PHASE_LABELS)[number];
const ROUND_LABELS = new Set<string>(ROUND_PHASE_LABELS);

export type GroupStats = {
  totalExact: number;
  totalPredictions: number;
  topAcertante: { userId: number; name: string | null; exact: number; total: number } | null;
  longestStreak: { userId: number; name: string | null; streak: number } | null;
  bestRound: { key: string; label: string; exactCount: number } | null;
  biggestBlowout: {
    userId: number;
    name: string | null;
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    margin: number;
  } | null;
};

export async function getGroupStats(groupId: number, tournamentId: number): Promise<GroupStats> {
  const [memberRows, allMatches, allPreds] = await Promise.all([
    db
      .select({ userId: groupMembers.userId, name: users.name })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId)),
    db
      .select({
        id: matches.id,
        matchNumber: matches.matchNumber,
        kickoffAt: matches.kickoffAt,
        matchDate: matches.matchDate,
        groupName: matches.groupName,
        homeTeam: matches.homeTeam,
        awayTeam: matches.awayTeam,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
      })
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId))
      .orderBy(asc(matches.kickoffAt)),
    db
      .select({
        userId: predictions.userId,
        matchId: predictions.matchId,
        homeScore: predictions.homeScore,
        awayScore: predictions.awayScore,
      })
      .from(predictions)
      .where(eq(predictions.groupId, groupId)),
  ]);

  if (memberRows.length === 0) {
    return {
      totalExact: 0,
      totalPredictions: 0,
      topAcertante: null,
      longestStreak: null,
      bestRound: null,
      biggestBlowout: null,
    };
  }

  const nameByUser = new Map(memberRows.map((m) => [m.userId, m.name]));
  const matchById = new Map(allMatches.map((m) => [m.id, m]));

  // Predicciones resueltas (con resultado final), en el mismo orden
  // cronológico que allMatches (ya viene ordenado por kickoffAt).
  type Resolved = {
    userId: number;
    match: (typeof allMatches)[number];
    result: "exact" | "outcome" | "miss";
  };
  const resolvedByMatch = new Map<number, typeof allPreds>();
  for (const p of allPreds) {
    const arr = resolvedByMatch.get(p.matchId) ?? [];
    arr.push(p);
    resolvedByMatch.set(p.matchId, arr);
  }

  const resolved: Resolved[] = [];
  for (const m of allMatches) {
    if (m.homeScore == null || m.awayScore == null) continue;
    for (const p of resolvedByMatch.get(m.id) ?? []) {
      const { result } = calcPoints(p.homeScore, p.awayScore, m.homeScore, m.awayScore);
      if (result === "pending") continue;
      resolved.push({ userId: p.userId, match: m, result });
    }
  }

  // ── Máximo acertante: más exactos del grupo (empate → más puntos totales) ──
  const perUser = new Map<number, { exact: number; total: number }>();
  for (const m of memberRows) perUser.set(m.userId, { exact: 0, total: 0 });
  for (const r of resolved) {
    const s = perUser.get(r.userId);
    if (!s) continue;
    if (r.result === "exact") {
      s.exact += 1;
      s.total += 4;
    } else if (r.result === "outcome") {
      s.total += 1;
    }
  }
  let topAcertante: GroupStats["topAcertante"] = null;
  for (const [userId, s] of perUser) {
    if (s.exact === 0) continue;
    if (
      !topAcertante ||
      s.exact > topAcertante.exact ||
      (s.exact === topAcertante.exact && s.total > topAcertante.total)
    ) {
      topAcertante = { userId, name: nameByUser.get(userId) ?? null, exact: s.exact, total: s.total };
    }
  }

  // ── Racha de exactos: mayor racha consecutiva (en orden cronológico) ──
  const byUserChrono = new Map<number, Resolved[]>();
  for (const r of resolved) {
    const arr = byUserChrono.get(r.userId) ?? [];
    arr.push(r);
    byUserChrono.set(r.userId, arr);
  }
  let longestStreak: GroupStats["longestStreak"] = null;
  for (const [userId, rows] of byUserChrono) {
    // rows respeta el orden de `resolved`, que ya sigue kickoffAt asc.
    let current = 0;
    let best = 0;
    for (const r of rows) {
      if (r.result === "exact") {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    if (best > 0 && (!longestStreak || best > longestStreak.streak)) {
      longestStreak = { userId, name: nameByUser.get(userId) ?? null, streak: best };
    }
  }

  // ── Mejor jornada: bucket con más exactos combinados del grupo ──
  // Bucket = ronda de eliminatoria (si aplica) o fecha (fase de grupos/liga).
  function roundKey(m: (typeof allMatches)[number]): { key: string; label: string } {
    if (m.groupName && ROUND_LABELS.has(m.groupName)) {
      const key = m.groupName as RoundPhaseLabel;
      return { key, label: key };
    }
    const label = m.matchDate ?? "—";
    return { key: `date:${label}`, label };
  }
  const exactByRound = new Map<string, { label: string; count: number }>();
  for (const r of resolved) {
    if (r.result !== "exact") continue;
    const { key, label } = roundKey(r.match);
    const cur = exactByRound.get(key) ?? { label, count: 0 };
    cur.count += 1;
    exactByRound.set(key, cur);
  }
  let bestRound: GroupStats["bestRound"] = null;
  for (const [key, v] of exactByRound) {
    if (!bestRound || v.count > bestRound.exactCount) {
      bestRound = { key, label: v.label, exactCount: v.count };
    }
  }

  // ── Mayor goleada acertada: exacto con mayor margen de goles ──
  let biggestBlowout: GroupStats["biggestBlowout"] = null;
  for (const r of resolved) {
    if (r.result !== "exact") continue;
    const m = matchById.get(r.match.id);
    if (!m || m.homeScore == null || m.awayScore == null) continue;
    const margin = Math.abs(m.homeScore - m.awayScore);
    if (!biggestBlowout || margin > biggestBlowout.margin) {
      biggestBlowout = {
        userId: r.userId,
        name: nameByUser.get(r.userId) ?? null,
        matchNumber: m.matchNumber,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        margin,
      };
    }
  }

  const totalExact = resolved.filter((r) => r.result === "exact").length;

  return {
    totalExact,
    totalPredictions: resolved.length,
    topAcertante,
    longestStreak,
    bestRound,
    biggestBlowout,
  };
}
