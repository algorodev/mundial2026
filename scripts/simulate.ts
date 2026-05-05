import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { matches } from "../lib/db/schema";
import { MATCHES } from "../lib/matches-data";

// Ventana real de simulación
const SIM_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const STARTUP_BUFFER_MS =
  (Number(process.env.SIM_BUFFER_SECONDS) || 60) * 1000;
const TICK_MS = 15_000;
const MATCH_DURATION_MIN = 90;
const GOALS_PER_TEAM_AVG = 1.35;

const cmd = (process.argv[2] || "start").replace(/^--/, "");

function fmt(ms: number) {
  return new Date(ms).toLocaleTimeString("es-ES");
}

async function reset() {
  console.log("🧹 Restaurando calendario real y limpiando resultados...");
  for (const m of MATCHES) {
    await db
      .update(matches)
      .set({
        kickoffAt: new Date(m.iso),
        homeScore: null,
        awayScore: null,
      })
      .where(eq(matches.matchNumber, m.num));
  }
  console.log(`✅ ${MATCHES.length} partidos restaurados`);
}

async function start() {
  const realFirst = new Date(MATCHES[0].iso).getTime();
  const realLast = MATCHES.reduce(
    (max, m) => Math.max(max, new Date(m.iso).getTime()),
    realFirst
  );
  const realSpan = realLast - realFirst;
  const ratio = SIM_WINDOW_MS / realSpan;

  const simStart = Date.now() + STARTUP_BUFFER_MS;
  const matchDurationMs = Math.max(
    MATCH_DURATION_MIN * 60 * 1000 * ratio,
    TICK_MS * 4
  );
  const ticksPerMatch = matchDurationMs / TICK_MS;
  const goalProb = GOALS_PER_TEAM_AVG / ticksPerMatch;

  console.log("");
  console.log("⚽ SIMULADOR DEL MUNDIAL — ventana 24h");
  console.log("─────────────────────────────────────");
  console.log(
    `Compresión: ${(1 / ratio).toFixed(1)}× (${(
      realSpan / 86_400_000
    ).toFixed(1)} días reales → 24h)`
  );
  console.log(
    `Duración por partido: ${(matchDurationMs / 60000).toFixed(1)} min reales`
  );
  console.log(
    `Primer partido a las ${fmt(simStart)} (en ${
      STARTUP_BUFFER_MS / 1000
    }s)`
  );
  console.log(`🔒 Cierre global se activa con el primer partido`);
  console.log(`Tick cada ${TICK_MS / 1000}s · Ctrl+C para parar`);
  console.log("─────────────────────────────────────");
  console.log("");

  const plan = MATCHES.map((m) => {
    const realMs = new Date(m.iso).getTime();
    const simKo = simStart + (realMs - realFirst) * ratio;
    return { ...m, simKo, simEnd: simKo + matchDurationMs };
  });

  console.log("📝 Reescribiendo kickoffs y limpiando resultados...");
  for (const p of plan) {
    await db
      .update(matches)
      .set({
        kickoffAt: new Date(p.simKo),
        homeScore: null,
        awayScore: null,
      })
      .where(eq(matches.matchNumber, p.num));
  }
  console.log(`✅ ${plan.length} partidos preparados`);
  console.log("");

  type State = { home: number; away: number; status: "pending" | "live" | "final" };
  const state = new Map<number, State>();
  for (const p of plan) state.set(p.num, { home: 0, away: 0, status: "pending" });

  let lastSummary = 0;

  async function tick() {
    const now = Date.now();

    for (const p of plan) {
      const s = state.get(p.num)!;
      if (s.status === "final") continue;
      if (now < p.simKo) continue;

      // Fin de partido
      if (now >= p.simEnd) {
        if (s.status === "live") {
          s.status = "final";
          console.log(
            `🏁 [${p.num.toString().padStart(2, "0")}] FT  ${p.home} ${s.home}-${s.away} ${p.away}`
          );
        }
        continue;
      }

      // Saque inicial: marcar 0-0
      if (s.status === "pending") {
        s.status = "live";
        await db
          .update(matches)
          .set({ homeScore: 0, awayScore: 0 })
          .where(eq(matches.matchNumber, p.num));
        console.log(
          `🟢 [${p.num.toString().padStart(2, "0")}] KO  ${p.home} 0-0 ${p.away}`
        );
      }

      // ¿Gol? — máximo uno por tick para que se vean separados
      const r = Math.random();
      if (r < goalProb) {
        s.home += 1;
      } else if (r < 2 * goalProb) {
        s.away += 1;
      } else {
        continue;
      }
      await db
        .update(matches)
        .set({ homeScore: s.home, awayScore: s.away })
        .where(eq(matches.matchNumber, p.num));
      console.log(
        `⚽ [${p.num.toString().padStart(2, "0")}]     ${p.home} ${s.home}-${s.away} ${p.away}`
      );
    }

    // Resumen cada minuto
    if (now - lastSummary > 60_000) {
      const live = plan.filter((p) => state.get(p.num)!.status === "live").length;
      const finals = plan.filter((p) => state.get(p.num)!.status === "final").length;
      const pending = plan.length - live - finals;
      console.log(
        `── ${fmt(now)} · ${live} en juego · ${finals} finalizados · ${pending} pendientes`
      );
      lastSummary = now;
    }

    if (plan.every((p) => state.get(p.num)!.status === "final")) {
      console.log("");
      console.log("🎉 Simulación completada — todos los partidos finalizados");
      console.log("   Para restaurar el calendario real: pnpm sim:reset");
      process.exit(0);
    }
  }

  process.on("SIGINT", () => {
    console.log("");
    console.log("🛑 Simulación detenida");
    console.log("   Calendario sigue desplazado. Restaura con: pnpm sim:reset");
    process.exit(0);
  });

  // Tick inmediato + intervalo
  await tick();
  setInterval(() => {
    tick().catch((e) => console.error("tick error:", e));
  }, TICK_MS);
}

(async () => {
  if (cmd === "reset") {
    await reset();
    process.exit(0);
  } else if (cmd === "start") {
    await start();
  } else {
    console.error("Uso: pnpm sim | pnpm sim:reset");
    process.exit(1);
  }
})().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
