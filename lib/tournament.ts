import { and, asc, eq } from "drizzle-orm";
import { db } from "./db";
import { matches } from "./db/schema";

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
