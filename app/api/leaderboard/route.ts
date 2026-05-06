import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, matches, predictions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { calcPoints } from "@/lib/scoring";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Cargar todo lo que necesitamos
  const [allUsers, allMatches, allPreds] = await Promise.all([
    db.select().from(users),
    db.select().from(matches),
    db.select().from(predictions),
  ]);

  // Indexar partidos por id
  const matchById = new Map(allMatches.map((m) => [m.id, m]));

  // Calcular puntos por usuario
  const stats = new Map<
    number,
    { userId: number; name: string; total: number; exact: number; outcome: number; miss: number; played: number }
  >();

  for (const u of allUsers) {
    if (u.isAdmin === 1) continue; // admin no participa
    stats.set(u.id, {
      userId: u.id,
      name: u.name,
      total: 0,
      exact: 0,
      outcome: 0,
      miss: 0,
      played: 0,
    });
  }

  for (const p of allPreds) {
    const s = stats.get(p.userId);
    if (!s) continue;
    const m = matchById.get(p.matchId);
    if (!m) continue;
    if (m.homeScore == null || m.awayScore == null) continue; // partido sin resultado

    const { points, result } = calcPoints(
      p.homeScore,
      p.awayScore,
      m.homeScore,
      m.awayScore
    );
    s.total += points;
    s.played += 1;
    if (result === "exact") s.exact += 1;
    else if (result === "outcome") s.outcome += 1;
    else if (result === "miss") s.miss += 1;
  }

  const leaderboard = Array.from(stats.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.exact !== a.exact) return b.exact - a.exact;
    return a.name.localeCompare(b.name);
  });

  // Asignar posiciones. Sólo se comparte puesto si coinciden total Y exactos:
  // los exactos rompen el empate de puntos para sacar al verdadero ganador.
  let prevTotal: number | null = null;
  let prevExact: number | null = null;
  let prevPos = 0;
  const ranked = leaderboard.map((row, idx) => {
    const tied =
      prevTotal !== null &&
      row.total === prevTotal &&
      row.exact === prevExact;
    const pos = tied ? prevPos : idx + 1;
    prevTotal = row.total;
    prevExact = row.exact;
    prevPos = pos;
    return { ...row, position: pos };
  });

  return NextResponse.json({ leaderboard: ranked });
}
