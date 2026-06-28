// Corrige la numeración oficial FIFA de los partidos de eliminatoria del
// Mundial 2026. Los números de partido 74-88 (R32) y 89-90 (R16) estaban
// incorrectos respecto al calendario oficial de la FIFA.
//
// Verificado contra Wikipedia (2026 FIFA World Cup round of 32) el 2026-06-28.
//
// Uso: pnpm tsx scripts/fix-knockout-numbering.ts

import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { matches, tournaments } from "../lib/db/schema";

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
  console.log(`🏆 Torneo: ${tournament.name} (id=${tid})`);

  // Para renumerar sin conflictos de clave única (tournamentId, matchNumber),
  // primero movemos los afectados a números temporales (200+), luego al
  // número definitivo correcto.
  //
  // Mapa: matchNumber actual → matchNumber correcto
  const swaps: [number, number][] = [
    // R32: rotación 74→76→75→74 (los tres partidos del 28-29 jun están mal)
    // old76(1C/2F/Houston) → new74
    // old74(1E/3rd/Boston) → new75
    // old75(1F/2C/Monterrey) → new76
    [76, 74],
    [74, 75],
    [75, 76],

    // R32: swap 77↔78 (Dallas/NY están invertidos)
    [77, 78],
    [78, 77],

    // R32: swap 81↔82 (Seattle/SF Bay están invertidos)
    [81, 82],
    [82, 81],

    // R32: swap 83↔84 (LA/Toronto están invertidos)
    [83, 84],
    [84, 83],

    // R32: rotación 86→88→87→86 (Dallas/Miami/Kansas City mal numerados)
    // old88(2D/2G/Dallas) → new86
    // old86(1J/2H/Miami)  → new87
    // old87(1K/3rd/KC)    → new88
    [88, 86],
    [86, 87],
    [87, 88],

    // R16: swap 89↔90 (Houston/Filadelfia invertidos)
    [89, 90],
    [90, 89],
  ];

  // Paso 1: mover todos a temporales (200 + num_correcto)
  const TMP = 200;
  for (const [from] of swaps) {
    await db
      .update(matches)
      .set({ matchNumber: TMP + from })
      .where(
        and(
          eq(matches.tournamentId, tid),
          eq(matches.matchNumber, from)
        )
      );
  }

  // Paso 2: mover de temporal al número definitivo correcto
  for (const [from, to] of swaps) {
    const updated = await db
      .update(matches)
      .set({ matchNumber: to })
      .where(
        and(
          eq(matches.tournamentId, tid),
          eq(matches.matchNumber, TMP + from)
        )
      )
      .returning({ matchNumber: matches.matchNumber });

    if (updated.length === 0) {
      console.warn(`⚠️  Partido ${from} no encontrado en la DB (ya migrado o no existe)`);
    } else {
      console.log(`  ✅ Partido ${from} → ${to}`);
    }
  }

  // También hay que actualizar homeTeam/awayTeam de los R16 que muestran
  // "Ganador Partido X" para que el número coincida con el nuevo número oficial.
  // Los partidos 91-96 se auto-corrigen por el renumerado de R32.
  // Sólo M89 y M90 necesitan actualizar el texto descriptivo:
  console.log("\n🔄 Actualizando textos descriptivos de R16 89 y 90...");

  await db
    .update(matches)
    .set({
      homeTeam: "Ganador Partido 73",
      awayTeam: "Ganador Partido 75",
      homeFrom: "match:73:W",
      awayFrom: "match:75:W",
    })
    .where(
      and(eq(matches.tournamentId, tid), eq(matches.matchNumber, 89))
    );
  console.log("  ✅ Partido 89: Ganador 73 vs Ganador 75 (Houston)");

  await db
    .update(matches)
    .set({
      homeTeam: "Ganador Partido 74",
      awayTeam: "Ganador Partido 77",
      homeFrom: "match:74:W",
      awayFrom: "match:77:W",
    })
    .where(
      and(eq(matches.tournamentId, tid), eq(matches.matchNumber, 90))
    );
  console.log("  ✅ Partido 90: Ganador 74 vs Ganador 77 (Filadelfia)");

  // Actualizar también los textos descriptivos de los otros R16 que ahora
  // apuntan a números renumerados (91-96 tienen los homeFrom/awayFrom correctos
  // ya que apuntan a números que ahora son correctos, pero el texto visible
  // "Ganador Partido X" también debe actualizarse).
  const r16Updates: Array<{ num: number; home: string; homeFrom: string; away: string; awayFrom: string }> = [
    { num: 91, home: "Ganador Partido 76", homeFrom: "match:76:W", away: "Ganador Partido 78", awayFrom: "match:78:W" },
    { num: 93, home: "Ganador Partido 83", homeFrom: "match:83:W", away: "Ganador Partido 84", awayFrom: "match:84:W" },
    { num: 94, home: "Ganador Partido 81", homeFrom: "match:81:W", away: "Ganador Partido 82", awayFrom: "match:82:W" },
    { num: 95, home: "Ganador Partido 86", homeFrom: "match:86:W", away: "Ganador Partido 88", awayFrom: "match:88:W" },
    { num: 96, home: "Ganador Partido 85", homeFrom: "match:85:W", away: "Ganador Partido 87", awayFrom: "match:87:W" },
  ];

  for (const u of r16Updates) {
    await db
      .update(matches)
      .set({
        homeTeam: u.home,
        homeFrom: u.homeFrom,
        awayTeam: u.away,
        awayFrom: u.awayFrom,
      })
      .where(and(eq(matches.tournamentId, tid), eq(matches.matchNumber, u.num)));
    console.log(`  ✅ Partido ${u.num}: ${u.home} vs ${u.away}`);
  }

  console.log("\n🎉 Migración completada.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
