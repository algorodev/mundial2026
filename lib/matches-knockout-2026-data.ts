// Fase eliminatoria del Mundial 2026 (partidos 73-104) — placeholders.
//
// Ningún cruce está decidido todavía. Cada partido nace con homeCode/awayCode
// null y un texto descriptivo ("2º Grupo A", "Ganador Partido 73") en
// home/away. `homeFrom`/`awayFrom` llevan la regla machine-readable que
// lib/knockout.ts usa para rellenar el cruce real en cuanto hay datos:
//   "group:<LETRA>:<1|2>" → 1º o 2º de ese grupo (resoluble solo con nuestra
//   propia tabla, sin esperar nada externo).
//   "match:<numero>:<W|L>" → ganador/perdedor de ese partido (resoluble en
//   cuanto ese partido tenga resultado no empatado).
// Los 8 cruces de dieciseisavos que dependen de qué equipo queda 3º (mejor
// 3º entre varios grupos) NO se resuelven solos — la FIFA decide la
// asignación exacta con una tabla de 495 combinaciones (Anexo C del
// reglamento) que no reproducimos aquí. Esos llevan homeFrom/awayFrom solo
// informativo ("thirds:A,B,C,D,F") y se completan a mano cuando se conozca
// el cruce real, igual que ya se hizo con la Final de Champions.
//
// Numeración oficial FIFA verificada contra Wikipedia (2026 FIFA World Cup
// round of 32 / knockout stage) el 2026-06-28.

export type KnockoutMatchData = {
  num: number;
  date: string;
  time: string;
  iso: string;
  group: string; // "R32" | "R16" | "Cuartos" | "Semifinal" | "3erPuesto" | "Final"
  home: string;
  away: string;
  homeFrom: string;
  awayFrom: string;
  stadium: string;
};

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MON = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function isoUTC(y: number, m: number, d: number, h: number, mi: number): string {
  return new Date(Date.UTC(y, m - 1, d, h, mi)).toISOString();
}

// Igual que en lib/matches-data.ts: mostramos siempre en hora peninsular
// (CEST, UTC+2 — todo el Mundial cae en horario de verano europeo).
function spainDisplay(iso: string): { date: string; time: string } {
  const spain = new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000);
  const date = `${DOW[spain.getUTCDay()]} ${spain.getUTCDate()} ${MON[spain.getUTCMonth()]}`;
  const time = `${String(spain.getUTCHours()).padStart(2, "0")}:${String(spain.getUTCMinutes()).padStart(2, "0")}`;
  return { date, time };
}

function m(
  num: number,
  group: string,
  utc: [number, number, number, number, number],
  home: string,
  homeFrom: string,
  away: string,
  awayFrom: string,
  stadium: string
): KnockoutMatchData {
  const iso = isoUTC(...utc);
  const { date, time } = spainDisplay(iso);
  return { num, date, time, iso, group, home, away, homeFrom, awayFrom, stadium };
}

export const KNOCKOUT_2026_MATCHES: KnockoutMatchData[] = [
  // ─── Dieciseisavos (R32) ──────────────────────────────────────────────
  // Numeración FIFA oficial (cronológica):
  m(73,  "R32", [2026, 6, 28, 19,  0], "2º Grupo A",  "group:A:2",        "2º Grupo B",          "group:B:2",        "Los Ángeles"),
  m(74,  "R32", [2026, 6, 29, 17,  0], "1º Grupo C",  "group:C:1",        "2º Grupo F",          "group:F:2",        "Houston"),
  m(75,  "R32", [2026, 6, 29, 20, 30], "1º Grupo E",  "group:E:1",        "3º (A/B/C/D/F)",      "thirds:A,B,C,D,F", "Boston"),
  m(76,  "R32", [2026, 6, 30,  1,  0], "1º Grupo F",  "group:F:1",        "2º Grupo C",          "group:C:2",        "Monterrey"),
  m(77,  "R32", [2026, 6, 30, 17,  0], "2º Grupo E",  "group:E:2",        "2º Grupo I",          "group:I:2",        "Dallas"),
  m(78,  "R32", [2026, 6, 30, 21,  0], "1º Grupo I",  "group:I:1",        "3º (C/D/F/G/H)",      "thirds:C,D,F,G,H", "Nueva York/Nueva Jersey"),
  m(79,  "R32", [2026, 7,  1,  1,  0], "1º Grupo A",  "group:A:1",        "3º (C/E/F/H/I)",      "thirds:C,E,F,H,I", "Ciudad de México"),
  m(80,  "R32", [2026, 7,  1, 16,  0], "1º Grupo L",  "group:L:1",        "3º (E/H/I/J/K)",      "thirds:E,H,I,J,K", "Atlanta"),
  m(81,  "R32", [2026, 7,  1, 20,  0], "1º Grupo G",  "group:G:1",        "3º (A/E/H/I/J)",      "thirds:A,E,H,I,J", "Seattle"),
  m(82,  "R32", [2026, 7,  2,  0,  0], "1º Grupo D",  "group:D:1",        "3º (B/E/F/I/J)",      "thirds:B,E,F,I,J", "Bahía de San Francisco"),
  m(83,  "R32", [2026, 7,  2, 19,  0], "1º Grupo H",  "group:H:1",        "2º Grupo J",          "group:J:2",        "Los Ángeles"),
  m(84,  "R32", [2026, 7,  2, 23,  0], "2º Grupo K",  "group:K:2",        "2º Grupo L",          "group:L:2",        "Toronto"),
  m(85,  "R32", [2026, 7,  3,  3,  0], "1º Grupo B",  "group:B:1",        "3º (E/F/G/I/J)",      "thirds:E,F,G,I,J", "Vancouver"),
  m(86,  "R32", [2026, 7,  3, 18,  0], "2º Grupo D",  "group:D:2",        "2º Grupo G",          "group:G:2",        "Dallas"),
  m(87,  "R32", [2026, 7,  3, 22,  0], "1º Grupo J",  "group:J:1",        "2º Grupo H",          "group:H:2",        "Miami"),
  m(88,  "R32", [2026, 7,  4,  1, 30], "1º Grupo K",  "group:K:1",        "3º (D/E/I/J/L)",      "thirds:D,E,I,J,L", "Kansas City"),

  // ─── Octavos (R16) ────────────────────────────────────────────────────
  m(89,  "R16", [2026, 7,  4, 17,  0], "Ganador Partido 73", "match:73:W", "Ganador Partido 75",  "match:75:W",       "Houston"),
  m(90,  "R16", [2026, 7,  4, 21,  0], "Ganador Partido 74", "match:74:W", "Ganador Partido 77",  "match:77:W",       "Filadelfia"),
  m(91,  "R16", [2026, 7,  5, 20,  0], "Ganador Partido 76", "match:76:W", "Ganador Partido 78",  "match:78:W",       "Nueva York/Nueva Jersey"),
  m(92,  "R16", [2026, 7,  6,  0,  0], "Ganador Partido 79", "match:79:W", "Ganador Partido 80",  "match:80:W",       "Ciudad de México"),
  m(93,  "R16", [2026, 7,  6, 19,  0], "Ganador Partido 83", "match:83:W", "Ganador Partido 84",  "match:84:W",       "Dallas"),
  m(94,  "R16", [2026, 7,  7,  0,  0], "Ganador Partido 81", "match:81:W", "Ganador Partido 82",  "match:82:W",       "Seattle"),
  m(95,  "R16", [2026, 7,  7, 16,  0], "Ganador Partido 86", "match:86:W", "Ganador Partido 88",  "match:88:W",       "Atlanta"),
  m(96,  "R16", [2026, 7,  7, 20,  0], "Ganador Partido 85", "match:85:W", "Ganador Partido 87",  "match:87:W",       "Vancouver"),

  // ─── Cuartos ──────────────────────────────────────────────────────────
  m(97,  "Cuartos",   [2026, 7,  9, 20,  0], "Ganador Partido 89", "match:89:W", "Ganador Partido 90",  "match:90:W",  "Boston"),
  m(98,  "Cuartos",   [2026, 7, 10, 19,  0], "Ganador Partido 93", "match:93:W", "Ganador Partido 94",  "match:94:W",  "Los Ángeles"),
  m(99,  "Cuartos",   [2026, 7, 11, 21,  0], "Ganador Partido 91", "match:91:W", "Ganador Partido 92",  "match:92:W",  "Miami"),
  m(100, "Cuartos",   [2026, 7, 12,  1,  0], "Ganador Partido 95", "match:95:W", "Ganador Partido 96",  "match:96:W",  "Kansas City"),

  // ─── Semifinales ──────────────────────────────────────────────────────
  m(101, "Semifinal", [2026, 7, 14, 19,  0], "Ganador Partido 97", "match:97:W", "Ganador Partido 98",  "match:98:W",  "Dallas"),
  m(102, "Semifinal", [2026, 7, 15, 19,  0], "Ganador Partido 99", "match:99:W", "Ganador Partido 100", "match:100:W", "Atlanta"),

  // ─── Tercer puesto y Final ────────────────────────────────────────────
  m(103, "3erPuesto", [2026, 7, 18, 21,  0], "Perdedor Partido 101", "match:101:L", "Perdedor Partido 102", "match:102:L", "Miami"),
  m(104, "Final",     [2026, 7, 19, 19,  0], "Ganador Partido 101",  "match:101:W", "Ganador Partido 102",  "match:102:W", "Nueva York/Nueva Jersey"),
];
