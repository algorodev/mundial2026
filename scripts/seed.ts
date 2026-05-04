import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { matches, users } from "../lib/db/schema";
import { MATCHES } from "../lib/matches-data";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🌱 Seeding base de datos...");

  // Insertar partidos (idempotente: si ya existe, no duplicar)
  console.log(`📅 Insertando ${MATCHES.length} partidos...`);
  for (const m of MATCHES) {
    await db
      .insert(matches)
      .values({
        matchNumber: m.num,
        matchDate: m.date,
        matchTime: m.time,
        kickoffAt: new Date(m.iso),
        groupName: m.group,
        homeTeam: m.home,
        awayTeam: m.away,
        homeFlag: m.homeFlag,
        awayFlag: m.awayFlag,
        stadium: m.stadium,
      })
      .onConflictDoNothing({ target: matches.matchNumber });
  }
  console.log("✅ Partidos cargados");

  // Crear admin si no existe
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn("⚠️ ADMIN_PASSWORD no definida. Saltando creación de admin.");
  } else {
    const adminName = "admin";
    const existing = await db
      .select()
      .from(users)
      .where(sql`${users.name} = ${adminName}`)
      .limit(1);

    if (existing.length === 0) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await db.insert(users).values({
        name: adminName,
        pinHash: hash,
        isAdmin: 1,
      });
      console.log(`✅ Admin creado (usuario: ${adminName})`);
    } else {
      console.log("ℹ️ Admin ya existe, no se modifica");
    }
  }

  console.log("🎉 Seed completado");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
