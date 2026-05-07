import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { matches, tournaments, users } from "../lib/db/schema";
import { MATCHES, flagToCode } from "../lib/matches-data";

const MUNDIAL_SLUG = "mundial-2026";

async function main() {
  console.log("🌱 Seeding base de datos...");

  // 1. Torneo "Mundial 2026"
  let [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, MUNDIAL_SLUG))
    .limit(1);

  if (!tournament) {
    [tournament] = await db
      .insert(tournaments)
      .values({
        slug: MUNDIAL_SLUG,
        name: "Mundial 2026",
        sport: "futbol",
        status: "upcoming",
      })
      .returning();
    console.log(`✅ Torneo creado: ${tournament.name}`);
  } else {
    console.log(`ℹ️  Torneo ya existe: ${tournament.name}`);
  }

  // 2. Partidos del torneo (upsert por (tournamentId, matchNumber)).
  // Hacemos update para que los códigos de equipo se rellenen también en
  // partidos cargados antes de añadir esa columna.
  console.log(`📅 Cargando ${MATCHES.length} partidos...`);
  for (const m of MATCHES) {
    const homeCode = flagToCode(m.homeFlag);
    const awayCode = flagToCode(m.awayFlag);
    await db
      .insert(matches)
      .values({
        tournamentId: tournament.id,
        matchNumber: m.num,
        matchDate: m.date,
        matchTime: m.time,
        kickoffAt: new Date(m.iso),
        groupName: m.group,
        homeTeam: m.home,
        awayTeam: m.away,
        homeCode,
        awayCode,
        homeFlag: m.homeFlag,
        awayFlag: m.awayFlag,
        stadium: m.stadium,
      })
      .onConflictDoUpdate({
        target: [matches.tournamentId, matches.matchNumber],
        set: {
          matchDate: m.date,
          matchTime: m.time,
          groupName: m.group,
          homeTeam: m.home,
          awayTeam: m.away,
          homeCode,
          awayCode,
          homeFlag: m.homeFlag,
          awayFlag: m.awayFlag,
          stadium: m.stadium,
          // OJO: deliberadamente no tocamos kickoffAt/homeScore/awayScore
          // para no pisar resultados ya metidos ni el simulador.
        },
      });
  }
  console.log("✅ Partidos cargados");

  // 3. Promocionar email a global admin (opcional vía env var)
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (adminEmail) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existing) {
      if (existing.isGlobalAdmin !== 1) {
        await db
          .update(users)
          .set({ isGlobalAdmin: 1 })
          .where(eq(users.id, existing.id));
        console.log(`✅ ${adminEmail} promocionado a global admin`);
      } else {
        console.log(`ℹ️  ${adminEmail} ya es global admin`);
      }
    } else {
      await db
        .insert(users)
        .values({
          email: adminEmail,
          name: adminEmail.split("@")[0],
          isGlobalAdmin: 1,
        });
      console.log(`✅ Admin creado en frío: ${adminEmail}`);
      console.log(
        "   (Aún sin sesión — entrará al pedir magic link la primera vez)"
      );
    }
  } else {
    console.log(
      "ℹ️  ADMIN_EMAIL no definido. Para tener admin global: defínelo y vuelve a ejecutar."
    );
  }

  console.log("🎉 Seed completado");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
