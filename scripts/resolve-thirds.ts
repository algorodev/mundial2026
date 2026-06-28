// Resuelve manualmente los 8 cruces de terceros clasificados del R32 del
// Mundial 2026. El resolver automático (lib/knockout.ts) no puede deducirlos
// porque dependen de la tabla FIFA de 495 combinaciones de mejores terceros.
//
// Terceros clasificados (los ocho mejores 3os): B, D, E, F, I, J, K, L
// Asignaciones oficiales FIFA verificadas el 2026-06-28.
//
// Uso: pnpm tsx scripts/resolve-thirds.ts

import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { matches, teams, tournaments } from "../lib/db/schema";

async function main() {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, "mundial-2026"))
    .limit(1);

  if (!tournament) {
    console.error("❌ No se encontró el torneo mundial-2026");
    process.exit(1);
  }

  const tid = tournament.id;

  // Cargar todos los equipos del torneo para obtener nombre, bandera, etc.
  const allTeams = await db
    .select()
    .from(teams)
    .where(eq(teams.tournamentId, tid));

  const byCode = new Map(allTeams.map((t) => [t.code, t]));

  const getTeam = (code: string) => {
    const t = byCode.get(code);
    if (!t) throw new Error(`Equipo no encontrado: ${code}`);
    return t;
  };

  // Asignaciones: [matchNumber, homeCode, awayCode]
  // Solo se rellena el lado que es "thirds:..." — el otro lado (group:X:1)
  // ya lo resuelve el cron automáticamente. Para evitar pisar lo que ya haya
  // resuelto, aquí actualizamos ambos lados explícitamente con los datos
  // oficiales confirmados.
  const assignments: Array<{ matchNum: number; home: string; away: string }> = [
    { matchNum: 75, home: "GER", away: "PAR" }, // 1E Alemania vs 3D Paraguay
    { matchNum: 78, home: "FRA", away: "SWE" }, // 1I Francia  vs 3F Suecia
    { matchNum: 79, home: "MEX", away: "ECU" }, // 1A México   vs 3E Ecuador
    { matchNum: 80, home: "ENG", away: "COD" }, // 1L Inglaterra vs 3K RD Congo
    { matchNum: 81, home: "EGY", away: "AUS" }, // 1G Egipto vs 3º Australia
    { matchNum: 82, home: "USA", away: "BIH" }, // 1D EE. UU.  vs 3B Bosnia
    { matchNum: 85, home: "SUI", away: "ALG" }, // 1B Suiza    vs 3J Argelia
    { matchNum: 88, home: "COL", away: "GHA" }, // 1K Colombia vs 3L Ghana
  ];

  for (const { matchNum, home, away } of assignments) {
    const ht = getTeam(home);
    const at = getTeam(away);

    const result = await db
      .update(matches)
      .set({
        homeCode: ht.code,
        homeTeam: ht.name,
        homeFlag: ht.flagEmoji,
        awayCode: at.code,
        awayTeam: at.name,
        awayFlag: at.flagEmoji,
      })
      .where(
        and(
          eq(matches.tournamentId, tid),
          eq(matches.matchNumber, matchNum)
        )
      )
      .returning({ id: matches.id });

    if (result.length === 0) {
      console.warn(`⚠️  Partido ${matchNum} no encontrado`);
    } else {
      console.log(`✅ Partido ${matchNum}: ${ht.name} vs ${at.name}`);
    }
  }

  console.log("\n🎉 Terceros resueltos.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
