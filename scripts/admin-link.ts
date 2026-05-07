import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { createMagicLink } from "../lib/auth";

// Genera un magic link para entrar sin pasar por SMTP. Útil cuando aún no
// tienes el email configurado o quieres entrar como admin rápidamente.
//
// Uso:
//   pnpm tsx scripts/admin-link.ts                    → usa ADMIN_EMAIL del .env
//   pnpm tsx scripts/admin-link.ts otro@email.com     → usa ese email
//
// El admin se promociona automáticamente si el email pasa coincide con
// ADMIN_EMAIL y aún no es global admin.

async function main() {
  const argEmail = process.argv[2];
  const email = (argEmail || process.env.ADMIN_EMAIL || "").toLowerCase().trim();

  if (!email) {
    console.error(
      "❌ No se ha pasado email y ADMIN_EMAIL no está definido en .env"
    );
    console.error("   Uso: pnpm tsx scripts/admin-link.ts <email>");
    process.exit(1);
  }

  // Si el email coincide con ADMIN_EMAIL y el user no existe o no es admin,
  // lo promocionamos para que entre con permisos.
  const adminEnv = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (adminEnv && email === adminEnv) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existing) {
      await db.insert(users).values({
        email,
        name: email.split("@")[0],
        isGlobalAdmin: 1,
      });
      console.log(`✅ Admin creado en frío: ${email}`);
    } else if (existing.isGlobalAdmin !== 1) {
      await db
        .update(users)
        .set({ isGlobalAdmin: 1 })
        .where(eq(users.id, existing.id));
      console.log(`✅ ${email} promocionado a global admin`);
    }
  }

  const token = await createMagicLink(email, null);
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const url = `${appUrl}/auth/verify?token=${encodeURIComponent(token)}`;

  console.log("");
  console.log("🔑 Magic link generado (válido 15 minutos, un solo uso):");
  console.log("");
  console.log(url);
  console.log("");
  console.log(`Email destino: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
