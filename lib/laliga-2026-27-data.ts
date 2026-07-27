// Datos del torneo "LaLiga 2026/27".
// Calendario oficial (38 jornadas) sacado de laliga.com/calendario-2026-2027
// el 2026-07-27. La fuente todavía no publica hora de cada partido (se
// confirma semana a semana, más cerca de la fecha) — usamos 21:00 CEST como
// placeholder en TODOS los partidos y lo dejamos anotado aquí. Cuando LaLiga
// confirme horarios reales, hay que actualizar kickoffAt a mano (el seed no
// pisa kickoffAt en updates para no romper el simulador / resultados ya
// metidos — ver upsertMatches en scripts/seed.ts).
//
// El bloqueo de predicciones por jornada (no por torneo entero) ya está
// soportado vía groups.predictionLockMode = "per-match": cada partido se
// cierra con su propio kickoff. Los grupos de esta liga deben crearse con
// ese modo.

import type { MatchData } from "./matches-data";

export const LALIGA_2026_27_SLUG = "laliga-2026-27";
export const LALIGA_2026_27_NAME = "LaLiga 2026/27";

// Hora placeholder (ver cabecera). Convierte CEST → UTC restando 2h, igual
// que el resto del proyecto (toda la temporada regular cae en horario de
// verano/invierno europeo; para partidos de enero-mayo en CET (UTC+1) esto
// deja el kickoff registrado 1h más tarde de lo real — aceptable para un
// placeholder que se va a corregir con el horario oficial de cada jornada).
function isoCEST(dateStr: string, timeStr: string): string {
  const [Y, M, D] = dateStr.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(Y, M - 1, D, h - 2, m)).toISOString();
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function dateLabel(dateStr: string): string {
  const [Y, M, D] = dateStr.split("-").map(Number);
  const wd = WEEKDAYS[new Date(Date.UTC(Y, M - 1, D)).getUTCDay()];
  return `${wd} ${D} ${MONTHS[M - 1]}`;
}

// Nombre oficial (tal cual aparece en laliga.com) → nombre corto a mostrar +
// código de 3 letras (clave también usada por scripts/map-api-ids.ts si se
// añaden overrides). No coinciden con ningún código ya usado en
// /public/teams (p. ej. "ESP" es la bandera de España del Mundial, por eso
// Espanyol usa "RCD").
const CLUBS: Record<string, { name: string; code: string }> = {
  "Deportivo Alavés": { name: "Alavés", code: "ALA" },
  "Getafe CF": { name: "Getafe", code: "GET" },
  "Atlético de Madrid": { name: "Atlético", code: "ATM" },
  "Málaga CF": { name: "Málaga", code: "MLG" },
  "RC Celta": { name: "Celta", code: "CEL" },
  "CA Osasuna": { name: "Osasuna", code: "OSA" },
  "RC Deportivo": { name: "Deportivo", code: "DEP" },
  "Elche CF": { name: "Elche", code: "ELC" },
  "RCD Espanyol de Barcelona": { name: "Espanyol", code: "RCD" },
  "Levante UD": { name: "Levante", code: "LEV" },
  "FC Barcelona": { name: "Barcelona", code: "BAR" },
  "Athletic Club": { name: "Athletic", code: "ATH" },
  "R. Racing Club": { name: "Racing", code: "RAC" },
  "Villarreal CF": { name: "Villarreal", code: "VIL" },
  "Real Madrid": { name: "Real Madrid", code: "RMA" },
  "Real Sociedad": { name: "Real Sociedad", code: "RSO" },
  "Sevilla FC": { name: "Sevilla", code: "SEV" },
  "Rayo Vallecano": { name: "Rayo Vallecano", code: "RAY" },
  "Valencia CF": { name: "Valencia", code: "VAL" },
  "Real Betis": { name: "Betis", code: "BET" },
};

export const LALIGA_2026_27_CODES: Record<string, string> = Object.fromEntries(
  Object.values(CLUBS).map((c) => [c.name, c.code])
);

// Cada entrada: [jornada, fecha "YYYY-MM-DD", 20 nombres oficiales en orden
// local/visitante/local/visitante/...]. Transcrito directamente de
// laliga.com/calendario-2026-2027 (jornadas 1-38), sin reordenar.
type Round = { num: number; date: string; teams: string[] };

const ROUNDS: Round[] = [
  { num: 1, date: "2026-08-16", teams: ["Deportivo Alavés", "Getafe CF", "Atlético de Madrid", "Málaga CF", "RC Celta", "CA Osasuna", "RC Deportivo", "Elche CF", "RCD Espanyol de Barcelona", "Levante UD", "FC Barcelona", "Athletic Club", "R. Racing Club", "Villarreal CF", "Real Madrid", "Real Sociedad", "Sevilla FC", "Rayo Vallecano", "Valencia CF", "Real Betis"] },
  { num: 2, date: "2026-08-23", teams: ["Athletic Club", "Sevilla FC", "Atlético de Madrid", "Villarreal CF", "Real Betis", "Real Sociedad", "Elche CF", "FC Barcelona", "RCD Espanyol de Barcelona", "Real Madrid", "Getafe CF", "R. Racing Club", "Málaga CF", "RC Deportivo", "CA Osasuna", "Levante UD", "Rayo Vallecano", "Deportivo Alavés", "Valencia CF", "RC Celta"] },
  { num: 3, date: "2026-08-30", teams: ["Deportivo Alavés", "Villarreal CF", "RC Celta", "Athletic Club", "RC Deportivo", "Valencia CF", "FC Barcelona", "Rayo Vallecano", "Levante UD", "Real Betis", "CA Osasuna", "Getafe CF", "R. Racing Club", "Elche CF", "Real Madrid", "Málaga CF", "Real Sociedad", "RCD Espanyol de Barcelona", "Sevilla FC", "Atlético de Madrid"] },
  { num: 4, date: "2026-09-06", teams: ["Deportivo Alavés", "CA Osasuna", "Athletic Club", "Atlético de Madrid", "Real Betis", "Real Madrid", "Elche CF", "Real Sociedad", "RCD Espanyol de Barcelona", "Sevilla FC", "Getafe CF", "RC Celta", "Málaga CF", "Levante UD", "Rayo Vallecano", "R. Racing Club", "Valencia CF", "FC Barcelona", "Villarreal CF", "RC Deportivo"] },
  { num: 5, date: "2026-09-13", teams: ["Athletic Club", "Elche CF", "RC Celta", "Málaga CF", "Getafe CF", "RC Deportivo", "Levante UD", "FC Barcelona", "CA Osasuna", "RCD Espanyol de Barcelona", "R. Racing Club", "Deportivo Alavés", "Real Madrid", "Rayo Vallecano", "Real Sociedad", "Atlético de Madrid", "Sevilla FC", "Valencia CF", "Villarreal CF", "Real Betis"] },
  { num: 6, date: "2026-09-16", teams: ["Deportivo Alavés", "Valencia CF", "Atlético de Madrid", "CA Osasuna", "Real Betis", "Getafe CF", "RC Deportivo", "Sevilla FC", "Elche CF", "Real Madrid", "FC Barcelona", "R. Racing Club", "Levante UD", "Athletic Club", "Málaga CF", "Villarreal CF", "Rayo Vallecano", "RCD Espanyol de Barcelona", "Real Sociedad", "RC Celta"] },
  { num: 7, date: "2026-09-20", teams: ["Athletic Club", "Deportivo Alavés", "Atlético de Madrid", "Real Madrid", "RC Celta", "R. Racing Club", "RC Deportivo", "Real Betis", "RCD Espanyol de Barcelona", "Elche CF", "Getafe CF", "Málaga CF", "CA Osasuna", "Rayo Vallecano", "Sevilla FC", "FC Barcelona", "Valencia CF", "Real Sociedad", "Villarreal CF", "Levante UD"] },
  { num: 8, date: "2026-10-11", teams: ["Deportivo Alavés", "Atlético de Madrid", "Real Betis", "CA Osasuna", "Elche CF", "RC Celta", "FC Barcelona", "Getafe CF", "Levante UD", "Sevilla FC", "Málaga CF", "RCD Espanyol de Barcelona", "R. Racing Club", "Valencia CF", "Rayo Vallecano", "Athletic Club", "Real Madrid", "Villarreal CF", "Real Sociedad", "RC Deportivo"] },
  { num: 9, date: "2026-10-18", teams: ["Real Betis", "FC Barcelona", "RC Celta", "Deportivo Alavés", "RC Deportivo", "Levante UD", "RCD Espanyol de Barcelona", "Atlético de Madrid", "Getafe CF", "Rayo Vallecano", "Málaga CF", "Real Sociedad", "CA Osasuna", "R. Racing Club", "Real Madrid", "Sevilla FC", "Valencia CF", "Athletic Club", "Villarreal CF", "Elche CF"] },
  { num: 10, date: "2026-10-25", teams: ["Deportivo Alavés", "Málaga CF", "Athletic Club", "Getafe CF", "Atlético de Madrid", "RC Deportivo", "RC Celta", "Real Betis", "FC Barcelona", "Real Madrid", "R. Racing Club", "RCD Espanyol de Barcelona", "Rayo Vallecano", "Elche CF", "Real Sociedad", "Levante UD", "Sevilla FC", "CA Osasuna", "Valencia CF", "Villarreal CF"] },
  { num: 11, date: "2026-11-01", teams: ["Athletic Club", "Real Sociedad", "Real Betis", "Málaga CF", "RC Deportivo", "CA Osasuna", "Elche CF", "Valencia CF", "FC Barcelona", "Deportivo Alavés", "Getafe CF", "Sevilla FC", "Levante UD", "Atlético de Madrid", "R. Racing Club", "Real Madrid", "Rayo Vallecano", "RC Celta", "Villarreal CF", "RCD Espanyol de Barcelona"] },
  { num: 12, date: "2026-11-08", teams: ["Atlético de Madrid", "FC Barcelona", "RC Celta", "Levante UD", "Elche CF", "Real Betis", "RCD Espanyol de Barcelona", "RC Deportivo", "Málaga CF", "R. Racing Club", "CA Osasuna", "Athletic Club", "Real Sociedad", "Rayo Vallecano", "Sevilla FC", "Deportivo Alavés", "Valencia CF", "Real Madrid", "Villarreal CF", "Getafe CF"] },
  { num: 13, date: "2026-11-22", teams: ["Deportivo Alavés", "RC Deportivo", "Athletic Club", "RCD Espanyol de Barcelona", "FC Barcelona", "Villarreal CF", "Getafe CF", "Atlético de Madrid", "Levante UD", "Elche CF", "CA Osasuna", "Málaga CF", "R. Racing Club", "Real Sociedad", "Rayo Vallecano", "Valencia CF", "Real Madrid", "RC Celta", "Sevilla FC", "Real Betis"] },
  { num: 14, date: "2026-11-29", teams: ["Real Betis", "Rayo Vallecano", "RC Celta", "Villarreal CF", "RC Deportivo", "FC Barcelona", "Elche CF", "Atlético de Madrid", "RCD Espanyol de Barcelona", "Getafe CF", "Levante UD", "R. Racing Club", "Málaga CF", "Athletic Club", "Real Madrid", "Deportivo Alavés", "Real Sociedad", "Sevilla FC", "Valencia CF", "CA Osasuna"] },
  { num: 15, date: "2026-12-06", teams: ["Deportivo Alavés", "RCD Espanyol de Barcelona", "Athletic Club", "Real Madrid", "Atlético de Madrid", "Real Betis", "FC Barcelona", "RC Celta", "Getafe CF", "Valencia CF", "CA Osasuna", "Elche CF", "R. Racing Club", "RC Deportivo", "Rayo Vallecano", "Levante UD", "Sevilla FC", "Málaga CF", "Villarreal CF", "Real Sociedad"] },
  { num: 16, date: "2026-12-13", teams: ["Atlético de Madrid", "Valencia CF", "Real Betis", "R. Racing Club", "RC Deportivo", "Athletic Club", "Elche CF", "Sevilla FC", "RCD Espanyol de Barcelona", "RC Celta", "Levante UD", "Deportivo Alavés", "Málaga CF", "FC Barcelona", "Real Madrid", "CA Osasuna", "Real Sociedad", "Getafe CF", "Villarreal CF", "Rayo Vallecano"] },
  { num: 17, date: "2026-12-20", teams: ["Deportivo Alavés", "Elche CF", "Athletic Club", "Real Betis", "RC Celta", "Atlético de Madrid", "RC Deportivo", "Real Madrid", "FC Barcelona", "Real Sociedad", "Getafe CF", "Levante UD", "CA Osasuna", "Villarreal CF", "Rayo Vallecano", "Málaga CF", "Sevilla FC", "R. Racing Club", "Valencia CF", "RCD Espanyol de Barcelona"] },
  { num: 18, date: "2027-01-03", teams: ["Real Betis", "Deportivo Alavés", "RC Celta", "RC Deportivo", "RCD Espanyol de Barcelona", "FC Barcelona", "Levante UD", "Valencia CF", "Málaga CF", "Elche CF", "R. Racing Club", "Athletic Club", "Rayo Vallecano", "Atlético de Madrid", "Real Madrid", "Getafe CF", "Real Sociedad", "CA Osasuna", "Villarreal CF", "Sevilla FC"] },
  { num: 19, date: "2027-01-10", teams: ["Deportivo Alavés", "Real Sociedad", "Athletic Club", "Villarreal CF", "Atlético de Madrid", "R. Racing Club", "RC Deportivo", "Rayo Vallecano", "Elche CF", "Getafe CF", "RCD Espanyol de Barcelona", "Real Betis", "CA Osasuna", "FC Barcelona", "Real Madrid", "Levante UD", "Sevilla FC", "RC Celta", "Valencia CF", "Málaga CF"] },
  { num: 20, date: "2027-01-17", teams: ["Atlético de Madrid", "Real Sociedad", "Real Betis", "RC Deportivo", "RC Celta", "Valencia CF", "FC Barcelona", "Elche CF", "Getafe CF", "Athletic Club", "Levante UD", "RCD Espanyol de Barcelona", "Málaga CF", "Real Madrid", "R. Racing Club", "CA Osasuna", "Rayo Vallecano", "Sevilla FC", "Villarreal CF", "Deportivo Alavés"] },
  { num: 21, date: "2027-01-24", teams: ["Deportivo Alavés", "FC Barcelona", "Athletic Club", "Levante UD", "RC Deportivo", "Atlético de Madrid", "Elche CF", "Rayo Vallecano", "RCD Espanyol de Barcelona", "Villarreal CF", "Getafe CF", "CA Osasuna", "R. Racing Club", "RC Celta", "Real Madrid", "Real Betis", "Real Sociedad", "Málaga CF", "Valencia CF", "Sevilla FC"] },
  { num: 22, date: "2027-01-31", teams: ["Atlético de Madrid", "RCD Espanyol de Barcelona", "Real Betis", "Elche CF", "RC Celta", "Getafe CF", "FC Barcelona", "Valencia CF", "Levante UD", "Real Sociedad", "Málaga CF", "Deportivo Alavés", "CA Osasuna", "RC Deportivo", "Rayo Vallecano", "Real Madrid", "Sevilla FC", "Athletic Club", "Villarreal CF", "R. Racing Club"] },
  { num: 23, date: "2027-02-07", teams: ["Deportivo Alavés", "RC Celta", "Athletic Club", "CA Osasuna", "Real Betis", "Sevilla FC", "RC Deportivo", "Málaga CF", "Elche CF", "Levante UD", "RCD Espanyol de Barcelona", "Rayo Vallecano", "FC Barcelona", "Atlético de Madrid", "Getafe CF", "Villarreal CF", "Real Sociedad", "Real Madrid", "Valencia CF", "R. Racing Club"] },
  { num: 24, date: "2027-02-14", teams: ["RC Celta", "Rayo Vallecano", "Elche CF", "RC Deportivo", "Levante UD", "Málaga CF", "CA Osasuna", "Atlético de Madrid", "R. Racing Club", "Getafe CF", "Real Madrid", "Athletic Club", "Real Sociedad", "Real Betis", "Sevilla FC", "RCD Espanyol de Barcelona", "Valencia CF", "Deportivo Alavés", "Villarreal CF", "FC Barcelona"] },
  { num: 25, date: "2027-02-21", teams: ["Deportivo Alavés", "R. Racing Club", "Athletic Club", "RC Celta", "Atlético de Madrid", "Elche CF", "RC Deportivo", "Real Sociedad", "RCD Espanyol de Barcelona", "CA Osasuna", "FC Barcelona", "Levante UD", "Málaga CF", "Real Betis", "Rayo Vallecano", "Getafe CF", "Sevilla FC", "Real Madrid", "Villarreal CF", "Valencia CF"] },
  { num: 26, date: "2027-02-28", teams: ["Athletic Club", "FC Barcelona", "Real Betis", "Villarreal CF", "RC Celta", "RCD Espanyol de Barcelona", "Getafe CF", "Deportivo Alavés", "Levante UD", "RC Deportivo", "Málaga CF", "Atlético de Madrid", "CA Osasuna", "Sevilla FC", "R. Racing Club", "Rayo Vallecano", "Real Madrid", "Valencia CF", "Real Sociedad", "Elche CF"] },
  { num: 27, date: "2027-03-07", teams: ["Deportivo Alavés", "Athletic Club", "Atlético de Madrid", "RC Celta", "RC Deportivo", "Getafe CF", "Elche CF", "Málaga CF", "RCD Espanyol de Barcelona", "R. Racing Club", "FC Barcelona", "Real Betis", "Rayo Vallecano", "CA Osasuna", "Sevilla FC", "Real Sociedad", "Valencia CF", "Levante UD", "Villarreal CF", "Real Madrid"] },
  { num: 28, date: "2027-03-14", teams: ["Deportivo Alavés", "Sevilla FC", "Athletic Club", "Valencia CF", "Real Betis", "Levante UD", "Elche CF", "Villarreal CF", "FC Barcelona", "RC Deportivo", "Getafe CF", "Real Sociedad", "Málaga CF", "Rayo Vallecano", "CA Osasuna", "RC Celta", "R. Racing Club", "Atlético de Madrid", "Real Madrid", "RCD Espanyol de Barcelona"] },
  { num: 29, date: "2027-03-21", teams: ["Atlético de Madrid", "Getafe CF", "RC Celta", "Real Madrid", "RCD Espanyol de Barcelona", "Athletic Club", "Levante UD", "CA Osasuna", "R. Racing Club", "Real Betis", "Rayo Vallecano", "FC Barcelona", "Real Sociedad", "Deportivo Alavés", "Sevilla FC", "Elche CF", "Valencia CF", "RC Deportivo", "Villarreal CF", "Málaga CF"] },
  { num: 30, date: "2027-04-04", teams: ["Athletic Club", "R. Racing Club", "Real Betis", "RC Celta", "RC Deportivo", "Villarreal CF", "Elche CF", "Deportivo Alavés", "FC Barcelona", "Sevilla FC", "Getafe CF", "RCD Espanyol de Barcelona", "Levante UD", "Rayo Vallecano", "Málaga CF", "CA Osasuna", "Real Madrid", "Atlético de Madrid", "Real Sociedad", "Valencia CF"] },
  { num: 31, date: "2027-04-11", teams: ["Deportivo Alavés", "Real Betis", "Atlético de Madrid", "Levante UD", "RC Celta", "Elche CF", "RCD Espanyol de Barcelona", "Málaga CF", "CA Osasuna", "Real Madrid", "R. Racing Club", "FC Barcelona", "Rayo Vallecano", "Real Sociedad", "Sevilla FC", "RC Deportivo", "Valencia CF", "Getafe CF", "Villarreal CF", "Athletic Club"] },
  { num: 32, date: "2027-04-18", teams: ["Deportivo Alavés", "Rayo Vallecano", "Atlético de Madrid", "Sevilla FC", "Real Betis", "Athletic Club", "RC Deportivo", "RC Celta", "Elche CF", "CA Osasuna", "FC Barcelona", "RCD Espanyol de Barcelona", "Getafe CF", "Real Madrid", "Levante UD", "Villarreal CF", "Málaga CF", "Valencia CF", "Real Sociedad", "R. Racing Club"] },
  { num: 33, date: "2027-04-21", teams: ["Athletic Club", "RC Deportivo", "RC Celta", "FC Barcelona", "RCD Espanyol de Barcelona", "Real Sociedad", "Getafe CF", "Real Betis", "CA Osasuna", "Deportivo Alavés", "R. Racing Club", "Málaga CF", "Real Madrid", "Elche CF", "Sevilla FC", "Levante UD", "Valencia CF", "Rayo Vallecano", "Villarreal CF", "Atlético de Madrid"] },
  { num: 34, date: "2027-05-02", teams: ["Atlético de Madrid", "Deportivo Alavés", "Real Betis", "Valencia CF", "RC Celta", "Sevilla FC", "RC Deportivo", "R. Racing Club", "Elche CF", "RCD Espanyol de Barcelona", "FC Barcelona", "CA Osasuna", "Levante UD", "Real Madrid", "Málaga CF", "Getafe CF", "Rayo Vallecano", "Villarreal CF", "Real Sociedad", "Athletic Club"] },
  { num: 35, date: "2027-05-09", teams: ["Deportivo Alavés", "Levante UD", "Athletic Club", "Málaga CF", "Real Betis", "RCD Espanyol de Barcelona", "Getafe CF", "Elche CF", "CA Osasuna", "Real Sociedad", "R. Racing Club", "Sevilla FC", "Rayo Vallecano", "RC Deportivo", "Real Madrid", "FC Barcelona", "Valencia CF", "Atlético de Madrid", "Villarreal CF", "RC Celta"] },
  { num: 36, date: "2027-05-16", teams: ["Atlético de Madrid", "Rayo Vallecano", "RC Deportivo", "Deportivo Alavés", "Elche CF", "Athletic Club", "RCD Espanyol de Barcelona", "Valencia CF", "Levante UD", "Getafe CF", "Málaga CF", "RC Celta", "CA Osasuna", "Real Betis", "Real Madrid", "R. Racing Club", "Real Sociedad", "FC Barcelona", "Sevilla FC", "Villarreal CF"] },
  { num: 37, date: "2027-05-23", teams: ["Deportivo Alavés", "Real Madrid", "Atlético de Madrid", "Athletic Club", "RC Celta", "Real Sociedad", "RC Deportivo", "RCD Espanyol de Barcelona", "FC Barcelona", "Málaga CF", "R. Racing Club", "Levante UD", "Rayo Vallecano", "Real Betis", "Sevilla FC", "Getafe CF", "Valencia CF", "Elche CF", "Villarreal CF", "CA Osasuna"] },
  { num: 38, date: "2027-05-30", teams: ["Athletic Club", "Rayo Vallecano", "Real Betis", "Atlético de Madrid", "Elche CF", "R. Racing Club", "RCD Espanyol de Barcelona", "Deportivo Alavés", "Getafe CF", "FC Barcelona", "Levante UD", "RC Celta", "Málaga CF", "Sevilla FC", "CA Osasuna", "Valencia CF", "Real Madrid", "RC Deportivo", "Real Sociedad", "Villarreal CF"] },
];

function buildMatches(): MatchData[] {
  const out: MatchData[] = [];
  for (const round of ROUNDS) {
    if (round.teams.length !== 20) {
      throw new Error(`Jornada ${round.num}: se esperaban 20 nombres, hay ${round.teams.length}`);
    }
    for (let i = 0; i < 10; i++) {
      const homeOfficial = round.teams[i * 2];
      const awayOfficial = round.teams[i * 2 + 1];
      const home = CLUBS[homeOfficial];
      const away = CLUBS[awayOfficial];
      if (!home) throw new Error(`Club desconocido: "${homeOfficial}" (jornada ${round.num})`);
      if (!away) throw new Error(`Club desconocido: "${awayOfficial}" (jornada ${round.num})`);
      out.push({
        num: (round.num - 1) * 10 + i + 1,
        date: dateLabel(round.date),
        time: "21:00",
        iso: isoCEST(round.date, "21:00"),
        group: `J${round.num}`,
        home: home.name,
        away: away.name,
        homeFlag: null,
        awayFlag: null,
        stadium: null,
      });
    }
  }
  return out;
}

export const LALIGA_2026_27_MATCHES: MatchData[] = buildMatches();
