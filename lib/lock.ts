// Lógica del cierre de predicciones por grupo.
//
// El cierre depende de tres campos del grupo:
//   - predictionLockMode:    "per-match" | "tournament-start"
//   - lockMinutesBefore:     int — solo aplica en per-match
//   - phase start time:      el primer kickoff de la FASE de ese partido
//                              (calculado en runtime desde matches, para
//                              sobrevivir al simulador)
//
// "per-match" es el comportamiento intuitivo: cada predicción se cierra cuando
// empieza ese partido (o N minutos antes). Soporta porras de muchos eventos
// independientes (LaLiga, Champions de varios partidos, etc.).
//
// "tournament-start" es el clásico de quiniela / Mundial: pronosticas todos
// los partidos de una fase antes de su primer pitido y a partir de ese
// momento se bloquea esa fase entera. El campo lockMinutesBefore se ignora en
// este modo. "Fase" es fase de grupos (un solo bloque, igual que cuando solo
// existía un corte por torneo) o cada ronda de eliminatoria por separado —
// ver lib/knockout-phases.ts. Así un grupo puede seguir prediciendo la final
// aunque la fase de grupos lleve semanas cerrada.

import type { Match } from "./db/schema";

export type LockMode = "per-match" | "tournament-start";

export type LockableGroup = {
  predictionLockMode: string; // viene como string de la DB; lo validamos abajo
  lockMinutesBefore: number;
};

// El umbral de cierre en modo tournament-start: o un único timestamp (ms) ya
// resuelto para todos los partidos, o una función que lo resuelve por
// partido a partir de su groupName (fase). Pasar un número plano sigue
// dando el comportamiento "un solo corte para todo" de siempre.
export type PhaseStartLookup = (
  groupName: string | null
) => number | null | undefined;

function asLockMode(s: string): LockMode {
  return s === "tournament-start" ? "tournament-start" : "per-match";
}

function resolveThreshold(
  groupName: string | null,
  phaseStart: PhaseStartLookup | number | null | undefined
): number | null | undefined {
  return typeof phaseStart === "function" ? phaseStart(groupName) : phaseStart;
}

/**
 * Devuelve true si la predicción de este partido ya está cerrada.
 *
 * @param match      el partido (con su kickoffAt y groupName)
 * @param group      grupo con su lock mode y lockMinutesBefore
 * @param phaseStart umbral en modo 'tournament-start' (ver PhaseStartLookup).
 *                   Si resuelve a null/undefined, esa fase no bloquea aún
 *                   (sin partidos cargados todavía).
 * @param now        timestamp actual; defaults a Date.now() para tests
 */
export function isMatchLocked(
  match: Pick<Match, "kickoffAt" | "groupName">,
  group: LockableGroup,
  phaseStart: PhaseStartLookup | number | null | undefined,
  now: number = Date.now()
): boolean {
  const mode = asLockMode(group.predictionLockMode);

  if (mode === "tournament-start") {
    const threshold = resolveThreshold(match.groupName, phaseStart);
    if (threshold == null) return false;
    return now >= threshold;
  }

  // per-match
  const minutesBefore = Math.max(0, group.lockMinutesBefore | 0);
  const matchMs = new Date(match.kickoffAt).getTime();
  return now >= matchMs - minutesBefore * 60_000;
}

/**
 * Devuelve true si el grupo entero está cerrado: ninguna predicción se puede
 * tocar, en ningún partido de ninguna fase.
 *
 * Útil para mostrar un banner "ya empezó".
 */
export function isWholeGroupLocked(
  matches: Pick<Match, "kickoffAt" | "groupName">[],
  group: LockableGroup,
  phaseStart: PhaseStartLookup | number | null | undefined,
  now: number = Date.now()
): boolean {
  if (matches.length === 0) return false;
  return matches.every((m) => isMatchLocked(m, group, phaseStart, now));
}

/**
 * "¿Se pueden ver los pronósticos ajenos?". El grupo configura visibility:
 *   - "open"               → siempre se ven
 *   - "hidden-until-lock"  → solo cuando se considera que el grupo "ha
 *                            arrancado" (depende del lockMode):
 *      · tournament-start: cuando ha arrancado el torneo
 *      · per-match:        cuando arranca el primer partido del torneo
 *                          (mismo criterio para mantener la UX consistente)
 */
export function arePeerPredictionsVisible(
  group: { predictionsVisibility: string },
  tournamentStart: number | null | undefined,
  now: number = Date.now()
): boolean {
  if (group.predictionsVisibility === "open") return true;
  if (tournamentStart == null) return false;
  return now >= tournamentStart;
}
