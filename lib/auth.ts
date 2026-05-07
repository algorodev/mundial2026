import { randomBytes } from "crypto";
import { and, eq, isNull, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { magicLinks, users } from "./db/schema";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 min

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  // pragmático, no RFC-completo
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Crea un magic link y devuelve el token. El caller manda el email.
 * redirectTo: ruta interna a la que volver tras login (e.g. /join/ABC123).
 */
export async function createMagicLink(
  email: string,
  redirectTo: string | null = null
): Promise<string> {
  const normalized = normalizeEmail(email);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(magicLinks).values({
    token,
    email: normalized,
    redirectTo: redirectTo && redirectTo.startsWith("/") ? redirectTo : null,
    expiresAt,
  });

  return token;
}

export type ConsumedLink = {
  userId: number;
  email: string;
  name: string;
  isGlobalAdmin: boolean;
  redirectTo: string | null;
};

/**
 * Consume un token: valida, marca como usado, busca o crea el user por email.
 * Devuelve null si el token no existe, ya fue consumido o caducó.
 */
export async function consumeMagicLink(
  token: string
): Promise<ConsumedLink | null> {
  const now = new Date();

  const [link] = await db
    .select()
    .from(magicLinks)
    .where(
      and(
        eq(magicLinks.token, token),
        isNull(magicLinks.consumedAt),
        gte(magicLinks.expiresAt, now)
      )
    )
    .limit(1);

  if (!link) return null;

  // Marcar consumido (idempotente: si alguien lo consume entre el SELECT y el UPDATE,
  // sólo uno gana porque la siguiente lectura ya no encontrará consumedAt nulo).
  const updated = await db
    .update(magicLinks)
    .set({ consumedAt: now })
    .where(and(eq(magicLinks.id, link.id), isNull(magicLinks.consumedAt)))
    .returning({ id: magicLinks.id });

  if (updated.length === 0) return null;

  // Buscar o crear user por email. El nombre por defecto es la parte local del email
  // (lo puede cambiar luego en su perfil — TODO si hace falta).
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, link.email))
    .limit(1);

  if (!user) {
    const defaultName = link.email.split("@")[0].slice(0, 60);
    [user] = await db
      .insert(users)
      .values({ email: link.email, name: defaultName })
      .returning();
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    isGlobalAdmin: user.isGlobalAdmin === 1,
    redirectTo: link.redirectTo,
  };
}

/**
 * Borra magic links caducados o consumidos hace más de 1 día.
 * Llamar oportunísticamente desde el endpoint de request-link.
 */
export async function gcMagicLinks() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db
    .delete(magicLinks)
    .where(sql`${magicLinks.expiresAt} < ${cutoff} OR ${magicLinks.consumedAt} < ${cutoff}`);
}
