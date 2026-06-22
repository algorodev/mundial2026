// Agrupación de matches.groupName en "fases" a efectos de bloqueo de
// predicciones en modo tournament-start. Sin dependencias de servidor (db,
// etc.) para poder importarse también desde componentes cliente.
//
// Fase de grupos (letras A-L), jornadas tipo "J1".."J38", null... todo lo que
// no sea una de las rondas de eliminatoria de abajo cae en un único bloque
// MAIN_PHASE — exactamente el comportamiento de antes (un solo corte para
// todo el torneo). Las rondas de eliminatoria del Mundial (ver
// lib/matches-knockout-2026-data.ts) tienen cada una su propio corte.

export const ROUND_PHASE_LABELS = [
  "R32",
  "R16",
  "Cuartos",
  "Semifinal",
  "3erPuesto",
  "Final",
] as const;

export const MAIN_PHASE = "__main__";

export function phaseKeyFor(groupName: string | null | undefined): string {
  if (
    groupName &&
    (ROUND_PHASE_LABELS as readonly string[]).includes(groupName)
  ) {
    return groupName;
  }
  return MAIN_PHASE;
}
