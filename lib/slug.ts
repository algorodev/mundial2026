import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin chars confusas (I, O, 0, 1)

export function randomInviteCode(len = 6): string {
  const buf = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function uniqueSlugCandidate(base: string): string {
  const suffix = randomInviteCode(4).toLowerCase();
  const root = base || "grupo";
  return `${root}-${suffix}`.slice(0, 80);
}
