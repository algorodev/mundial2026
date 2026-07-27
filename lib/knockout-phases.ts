// Agrupación de matches.groupName en "fases" a efectos de bloqueo de
// predicciones en modo tournament-start. Sin dependencias de servidor (db,
// etc.) para poder importarse también desde componentes cliente.
//
// Fase de grupos (letras A-L), null... todo lo que no sea una jornada de
// liga ("J1".."J38") ni una de las rondas de eliminatoria de abajo cae en
// un único bloque MAIN_PHASE — exactamente el comportamiento de antes (un
// solo corte para todo el torneo). Las rondas de eliminatoria del Mundial
// (ver lib/matches-knockout-2026-data.ts) tienen cada una su propio corte.
//
// Las jornadas de liga ("J1", "J2", ...) también tienen cada una su propio
// corte: así una porra en modo tournament-start bloquea jornada a jornada
// (todos los partidos de esa semana se cierran juntos en su primer kickoff)
// en vez de bloquear la temporada entera con el primer partido de J1.

export const ROUND_PHASE_LABELS = [
  "R32",
  "R16",
  "Cuartos",
  "Semifinal",
  "3erPuesto",
  "Final",
] as const;

export const MAIN_PHASE = "__main__";

const JORNADA_RE = /^J\d+$/;

export function phaseKeyFor(groupName: string | null | undefined): string {
  if (!groupName) return MAIN_PHASE;
  if ((ROUND_PHASE_LABELS as readonly string[]).includes(groupName)) {
    return groupName;
  }
  if (JORNADA_RE.test(groupName)) {
    return groupName;
  }
  return MAIN_PHASE;
}
