import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  tournaments,
  groups,
  groupMembers,
  users,
} from "../lib/db/schema";
import { randomInviteCode } from "../lib/slug";

// Crea (o reutiliza) la "porra oficial pública" de un torneo y la marca
// como visible para todo el mundo. La porra queda owned por el admin
// global (ADMIN_EMAIL) y referenciada desde tournaments.officialGroupId.
//
// Uso:
//   pnpm tsx scripts/make-official.ts mundial-2026
//
// Idempotente: si el torneo ya tiene una porra oficial, sólo se asegura
// de que esté marcada como public y se imprime su URL.

async function main() {
  const tournamentSlug = process.argv[2];
  if (!tournamentSlug) {
    console.error("❌ Falta el slug del torneo");
    console.error("   Uso: pnpm tsx scripts/make-official.ts <tournament-slug>");
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!adminEmail) {
    console.error("❌ ADMIN_EMAIL no está definido en .env");
    process.exit(1);
  }

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.slug, tournamentSlug))
    .limit(1);

  if (!tournament) {
    console.error(`❌ Torneo no encontrado: ${tournamentSlug}`);
    process.exit(1);
  }

  let [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!admin) {
    [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        name: adminEmail.split("@")[0],
        isGlobalAdmin: 1,
      })
      .returning();
    console.log(`✅ Admin creado en frío: ${adminEmail}`);
  } else if (admin.isGlobalAdmin !== 1) {
    await db
      .update(users)
      .set({ isGlobalAdmin: 1 })
      .where(eq(users.id, admin.id));
    console.log(`✅ ${adminEmail} promocionado a global admin`);
  }

  // Si ya hay porra oficial enlazada, sólo nos aseguramos de la visibilidad
  // y devolvemos su URL.
  if (tournament.officialGroupId) {
    const [existing] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, tournament.officialGroupId))
      .limit(1);

    if (existing) {
      if (existing.visibility !== "public") {
        await db
          .update(groups)
          .set({ visibility: "public" })
          .where(eq(groups.id, existing.id));
        console.log(`✅ Grupo ${existing.slug} marcado como public`);
      }
      printResult(tournament.name, existing.slug, existing.inviteCode);
      process.exit(0);
    }
  }

  // Crear el grupo oficial nuevo.
  const groupName = `Porra Oficial · ${tournament.name}`;
  const groupSlug = `oficial-${tournamentSlug}`;
  const inviteCode = randomInviteCode(6);

  const [newGroup] = await db
    .insert(groups)
    .values({
      slug: groupSlug,
      name: groupName,
      tournamentId: tournament.id,
      ownerId: admin.id,
      inviteCode,
      visibility: "public",
      // La porra oficial es masiva: bloqueo por partido (no por inicio del
      // torneo) y entradas tardías permitidas para captar usuarios durante
      // toda la competición.
      predictionLockMode: "per-match",
      lockMinutesBefore: 0,
      joinPolicy: "open",
      allowLateJoin: 1,
      predictionsVisibility: "hidden-until-lock",
    })
    .returning();

  await db.insert(groupMembers).values({
    groupId: newGroup.id,
    userId: admin.id,
    role: "owner",
  });

  await db
    .update(tournaments)
    .set({ officialGroupId: newGroup.id })
    .where(eq(tournaments.id, tournament.id));

  console.log(`✅ Porra oficial creada: ${groupName}`);
  printResult(tournament.name, newGroup.slug, newGroup.inviteCode);
}

function printResult(tournamentName: string, slug: string, inviteCode: string) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  console.log("");
  console.log(`🏆 ${tournamentName}`);
  console.log(`   Leaderboard público: ${appUrl}/g/${slug}/leaderboard`);
  console.log(`   Invitación: ${appUrl}/join/${inviteCode}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
