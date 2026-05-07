// Lógica del cierre de predicciones por grupo.
//
// El cierre depende de tres campos del grupo:
//   - predictionLockMode:    "per-match" | "tournament-start"
//   - lockMinutesBefore:     int — solo aplica en per-match
//   - tournament start time: el primer kickoff del torneo (calculado en runtime
//                              desde matches, para sobrevivir al simulador)
//
// "per-match" es el comportamiento intuitivo: cada predicción se cierra cuando
// empieza ese partido (o N minutos antes). Soporta porras de muchos eventos
// independientes (LaLiga, Champions de varios partidos, etc.).
//
// "tournament-start" es el clásico de quiniela / Mundial: pronosticas todos
// los partidos antes del primer pitido y a partir de ese momento se bloquea
// todo. El campo lockMinutesBefore se ignora en este modo.

import type { Match } from "./db/schema";

export type LockMode = "per-match" | "tournament-start";

export type LockableGroup = {
  predictionLockMode: string; // viene como string de la DB; lo validamos abajo
  lockMinutesBefore: number;
};

function asLockMode(s: string): LockMode {
  return s === "tournament-start" ? "tournament-start" : "per-match";
}

/**
 * Devuelve true si la predicción de este partido ya está cerrada.
 *
 * @param match           el partido (con su kickoffAt)
 * @param group           grupo con su lock mode y lockMinutesBefore
 * @param tournamentStart timestamp del primer kickoff del torneo (ms desde epoch).
 *                        Solo se usa en modo 'tournament-start'. Si null o
 *                        undefined, ese modo no bloquea (torneo aún sin partidos).
 * @param now             timestamp actual; defaults a Date.now() para tests
 */
export function isMatchLocked(
  match: Pick<Match, "kickoffAt">,
  group: LockableGroup,
  tournamentStart: number | null | undefined,
  now: number = Date.now()
): boolean {
  const mode = asLockMode(group.predictionLockMode);

  if (mode === "tournament-start") {
    if (tournamentStart == null) return false;
    return now >= tournamentStart;
  }

  // per-match
  const minutesBefore = Math.max(0, group.lockMinutesBefore | 0);
  const matchMs = new Date(match.kickoffAt).getTime();
  return now >= matchMs - minutesBefore * 60_000;
}

/**
 * Devuelve true si el grupo entero está cerrado: ninguna predicción se puede
 * tocar. En modo per-match, esto sólo es true si TODOS los partidos están ya
 * lockeados. En modo tournament-start, lo está cuando empieza el torneo.
 *
 * Útil para mostrar un banner "ya empezó".
 */
export function isWholeGroupLocked(
  matches: Pick<Match, "kickoffAt">[],
  group: LockableGroup,
  tournamentStart: number | null | undefined,
  now: number = Date.now()
): boolean {
  const mode = asLockMode(group.predictionLockMode);
  if (mode === "tournament-start") {
    if (tournamentStart == null) return false;
    return now >= tournamentStart;
  }
  if (matches.length === 0) return false;
  return matches.every((m) => isMatchLocked(m, group, tournamentStart, now));
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
