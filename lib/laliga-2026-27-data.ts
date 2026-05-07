// Datos del torneo "LaLiga 2026/27".
// La temporada arranca el 1 de agosto de 2026 (provisional). El calendario
// oficial todavía no está publicado, así que el array de partidos arranca
// vacío. Cuando salga el calendario, cargamos los matches por jornada
// usando matches.groupName = "J1", "J2", ..., "J38".
//
// IMPORTANTE: la mecánica de la porra para una liga es por **jornada**, no
// por la temporada entera (al estilo quiniela). El cierre de predicciones
// y la visibilidad de pronósticos ajenos deberían ir por jornada, no por
// el primer kickoff del torneo. Eso requerirá ajustar la lógica de
// `lib/tournament.ts` y `/api/predictions` cuando carguemos partidos —
// dejado a propósito como TODO hasta que sea necesario.

import type { MatchData } from "./matches-data";

export const LALIGA_2026_27_SLUG = "laliga-2026-27";
export const LALIGA_2026_27_NAME = "LaLiga 2026/27";

export const LALIGA_2026_27_MATCHES: MatchData[] = [];

// Mapping nombre del club → código (debe coincidir con /public/teams/{code}.png).
// Se rellenará cuando carguemos partidos. Por ahora vacío.
export const LALIGA_2026_27_CODES: Record<string, string> = {};
