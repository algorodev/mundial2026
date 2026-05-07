// Datos del torneo "UEFA Champions League 2025-26".
// La temporada ya está en curso; sólo cargamos los partidos que quedan
// pendientes de jugarse para que la porra del grupo tenga sentido.
//
// Si añades más partidos (p. ej. semifinales antes de la final), sigue
// el mismo formato que abajo.

import type { MatchData } from "./matches-data";

// Convierte hora CEST a UTC (Europa central en horario de verano = UTC+2).
function isoCEST(dateStr: string, timeStr: string): string {
  const [Y, M, D] = dateStr.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(Y, M - 1, D, h - 2, m)).toISOString();
}

export const CHAMPIONS_2026_SLUG = "champions-2025-26";
export const CHAMPIONS_2026_NAME = "UEFA Champions League 2025-26";

export const CHAMPIONS_2026_MATCHES: MatchData[] = [
  {
    num: 1,
    date: "Sáb 30 May",
    time: "21:00",
    iso: isoCEST("2026-05-30", "21:00"),
    group: "Final",
    home: "Arsenal",
    away: "PSG",
    homeFlag: null,
    awayFlag: null,
    stadium: "Puskás Aréna · Budapest",
  },
];

// Códigos FIFA-style de los clubes (deben coincidir con /public/teams/{code}.png).
// El seed lee este mapping para rellenar match.homeCode / match.awayCode.
export const CHAMPIONS_2026_CODES: Record<string, string> = {
  Arsenal: "ARS",
  PSG: "PSG",
};
