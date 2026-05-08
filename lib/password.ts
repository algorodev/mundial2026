import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export const PASSWORD_MIN_LENGTH = MIN_LENGTH;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function validatePassword(plain: unknown): string | null {
  if (typeof plain !== "string") return "La contraseña no es válida";
  if (plain.length < MIN_LENGTH)
    return `La contraseña debe tener al menos ${MIN_LENGTH} caracteres`;
  if (plain.length > MAX_LENGTH)
    return `La contraseña es demasiado larga (máximo ${MAX_LENGTH})`;
  return null;
}
