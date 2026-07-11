// "Dónde ver" en España — Mundial 2026.
// No existe (a día de este snapshot, 2026-07-11) un reparto de derechos de
// TV confirmado partido a partido, así que en vez de inventar un canal por
// cada uno de los 104 partidos, aplicamos la regla que sí es estable en
// España: los partidos de "interés general" (los de la Selección, semis y
// final) son obligatoriamente en abierto por ley. El resto queda "Por
// confirmar" hasta que haya reparto oficial — mejor admitir que no lo
// sabemos que mostrar un canal inventado.
//
// Si más adelante se confirma el reparto completo, sustituir por un
// Record<matchNumber, string> real (ver plan) sin tocar el resto de la UI:
// el consumidor solo usa el string devuelto por channelForMatch().

const SPAIN_FREE_TO_AIR = "La 1 (RTVE)";
const TBD = null;

export function channelForMatch(match: {
  homeCode: string | null;
  awayCode: string | null;
  groupName: string | null; // fase de grupos (letra) o ronda de eliminatoria
}): string | null {
  const involvesSpain = match.homeCode === "ESP" || match.awayCode === "ESP";
  const isLateKnockout = match.groupName === "Semifinal" || match.groupName === "Final" || match.groupName === "3erPuesto";
  if (involvesSpain || isLateKnockout) return SPAIN_FREE_TO_AIR;
  return TBD;
}
