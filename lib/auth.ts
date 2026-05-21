import { randomBytes } from "crypto";
import { and, eq, isNull, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { magicLinks } from "./db/schema";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 min

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  // pragmático, no RFC-completo
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export type MagicLinkPurpose = "set-password" | "reset" | "login";

/**
 * Crea un magic link y devuelve el token. El caller decide a quién mandar el
 * email.
 *
 * purpose distingue los tres flujos: "set-password" / "reset" (ambos llevan
 * a /auth/set-password) y "login" (sesión sin contraseña, lleva a
 * /auth/magic-login).
 *
 * redirectTo: ruta interna a la que volver tras consumir el token (e.g.
 * /join/ABC123). Se persiste y se devuelve cuando se consume.
 */
export async function createMagicLink(
  email: string,
  redirectTo: string | null = null,
  purpose: MagicLinkPurpose = "set-password"
): Promise<string> {
  const normalized = normalizeEmail(email);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(magicLinks).values({
    token,
    email: normalized,
    purpose,
    redirectTo: redirectTo && redirectTo.startsWith("/") ? redirectTo : null,
    expiresAt,
  });

  return token;
}

export type MagicLinkPeek = {
  email: string;
  purpose: MagicLinkPurpose;
  redirectTo: string | null;
};

/**
 * Lee un token sin consumirlo. Útil en server components que pintan el form
 * de set-password antes de que el usuario pulse "guardar". Devuelve null si
 * el token no existe, ya fue consumido o caducó.
 *
 * Importante: NO marca el token como consumido. Esto deja el flujo a salvo
 * de prefetchers de email (Outlook Safe Links etc.) que hacen GET sobre el
 * link y nos dejarían el token "ya usado" antes de que el usuario llegase.
 */
export async function peekMagicLink(
  token: string
): Promise<MagicLinkPeek | null> {
  const now = new Date();
  const [link] = await db
    .select({
      email: magicLinks.email,
      purpose: magicLinks.purpose,
      redirectTo: magicLinks.redirectTo,
    })
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
  return {
    email: link.email,
    purpose: link.purpose as MagicLinkPurpose,
    redirectTo: link.redirectTo,
  };
}

export type ConsumedLink = {
  email: string;
  purpose: MagicLinkPurpose;
  redirectTo: string | null;
};

/**
 * Consume un token: valida y lo marca como usado de forma atómica. El caller
 * se encarga de localizar/actualizar el user (set passwordHash, etc.).
 *
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

  // Marcar consumido (idempotente: si alguien lo consume entre el SELECT y
  // el UPDATE, sólo uno gana porque el WHERE filtra consumedAt nulo).
  const updated = await db
    .update(magicLinks)
    .set({ consumedAt: now })
    .where(and(eq(magicLinks.id, link.id), isNull(magicLinks.consumedAt)))
    .returning({ id: magicLinks.id });

  if (updated.length === 0) return null;

  return {
    email: link.email,
    purpose: link.purpose as MagicLinkPurpose,
    redirectTo: link.redirectTo,
  };
}

/**
 * Borra magic links caducados o consumidos hace más de 1 día.
 * Llamar oportunísticamente desde los endpoints que crean tokens.
 */
export async function gcMagicLinks() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db
    .delete(magicLinks)
    .where(sql`${magicLinks.expiresAt} < ${cutoff} OR ${magicLinks.consumedAt} < ${cutoff}`);
}
