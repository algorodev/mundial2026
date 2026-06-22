import { and, asc, eq } from "drizzle-orm";
import { db } from "./db";
import { matches } from "./db/schema";
import { phaseKeyFor } from "./knockout-phases";

// Inicio efectivo del torneo = primer kickoff registrado en la DB.
// Se lee en runtime para que el simulador (que reescribe kickoffAt) active
// el cierre cuando empieza la simulación, no la fecha real.
export async function getTournamentStart(
  tournamentId: number
): Promise<{ iso: string; label: string } | null> {
  const [first] = await db
    .select({ kickoffAt: matches.kickoffAt })
    .from(matches)
    .where(eq(matches.tournamentId, tournamentId))
    .orderBy(asc(matches.kickoffAt))
    .limit(1);

  if (!first) return null;

  return {
    iso: first.kickoffAt.toISOString(),
    label: formatStartLabel(first.kickoffAt),
  };
}

export type PhaseStart = { iso: string; label: string };

// Como getTournamentStart, pero un timestamp por fase en vez de uno global
// para todo el torneo. En modo tournament-start, cada ronda de eliminatoria
// (ver lib/knockout-phases.ts) se cierra con su propio primer kickoff en vez
// de con el del Mundial entero. Útil para que un grupo pueda predecir la
// final aunque la fase de grupos ya esté cerrada desde hace semanas.
export async function getPhaseStarts(
  tournamentId: number
): Promise<Record<string, PhaseStart>> {
  const rows = await db
    .select({ groupName: matches.groupName, kickoffAt: matches.kickoffAt })
    .from(matches)
    .where(eq(matches.tournamentId, tournamentId));

  const earliest = new Map<string, Date>();
  for (const r of rows) {
    const key = phaseKeyFor(r.groupName);
    const current = earliest.get(key);
    if (!current || r.kickoffAt < current) earliest.set(key, r.kickoffAt);
  }

  const out: Record<string, PhaseStart> = {};
  for (const [key, date] of earliest) {
    out[key] = { iso: date.toISOString(), label: formatStartLabel(date) };
  }
  return out;
}

export function phaseStartMs(
  phaseStarts: Record<string, PhaseStart>,
  groupName: string | null | undefined
): number | null {
  const entry = phaseStarts[phaseKeyFor(groupName)];
  return entry ? new Date(entry.iso).getTime() : null;
}

const LABEL_FMT = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

function formatStartLabel(date: Date): string {
  const parts = LABEL_FMT.formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const wd = capitalize(get("weekday").replace(".", ""));
  const day = get("day");
  const mon = capitalize(get("month").replace(".", ""));
  const hour = get("hour");
  const min = get("minute");
  return `${wd} ${day} ${mon} · ${hour}:${min}`;
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}
