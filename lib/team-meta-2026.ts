// Ficha de selección para las 48 plazas del Mundial 2026.
// Snapshot as-of 2026-07-11: ranking FIFA ORIENTATIVO (no se sincroniza con
// ninguna API — la FIFA no lo expone en API-Football), apodo habitual y
// confederación. Dato puramente informativo para enriquecer la ficha de
// partido; no afecta a puntuación ni lógica de negocio.
//
// La clave es el código FIFA de 3 letras (matches.homeCode/awayCode).

export type ConfederationCode = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

export type TeamMeta = {
  fifaRanking: number | null;
  nickname: string | null;
  confederation: ConfederationCode;
};

export const TEAM_META_2026: Record<string, TeamMeta> = {
  ARG: { fifaRanking: 1, nickname: "La Albiceleste", confederation: "CONMEBOL" },
  FRA: { fifaRanking: 2, nickname: "Les Bleus", confederation: "UEFA" },
  ESP: { fifaRanking: 3, nickname: "La Roja", confederation: "UEFA" },
  ENG: { fifaRanking: 4, nickname: "Los Tres Leones", confederation: "UEFA" },
  BRA: { fifaRanking: 5, nickname: "La Canarinha", confederation: "CONMEBOL" },
  POR: { fifaRanking: 6, nickname: "A Seleção", confederation: "UEFA" },
  NED: { fifaRanking: 7, nickname: "La Naranja Mecánica", confederation: "UEFA" },
  BEL: { fifaRanking: 8, nickname: "Los Diablos Rojos", confederation: "UEFA" },
  GER: { fifaRanking: 9, nickname: "La Mannschaft", confederation: "UEFA" },
  COL: { fifaRanking: 10, nickname: "Los Cafeteros", confederation: "CONMEBOL" },
  CRO: { fifaRanking: 11, nickname: "Los Fogosos (Vatreni)", confederation: "UEFA" },
  MAR: { fifaRanking: 12, nickname: "Los Leones del Atlas", confederation: "CAF" },
  URU: { fifaRanking: 13, nickname: "La Celeste", confederation: "CONMEBOL" },
  USA: { fifaRanking: 14, nickname: "USMNT", confederation: "CONCACAF" },
  SUI: { fifaRanking: 15, nickname: "La Nati", confederation: "UEFA" },
  JPN: { fifaRanking: 16, nickname: "Los Samurái Azul", confederation: "AFC" },
  SEN: { fifaRanking: 17, nickname: "Los Leones de la Teranga", confederation: "CAF" },
  IRN: { fifaRanking: 18, nickname: "Team Melli", confederation: "AFC" },
  KOR: { fifaRanking: 19, nickname: "Los Guerreros Taeguk", confederation: "AFC" },
  ECU: { fifaRanking: 20, nickname: "La Tri", confederation: "CONMEBOL" },
  AUT: { fifaRanking: 21, nickname: "Das Team", confederation: "UEFA" },
  CIV: { fifaRanking: 22, nickname: "Los Elefantes", confederation: "CAF" },
  EGY: { fifaRanking: 23, nickname: "Los Faraones", confederation: "CAF" },
  PAN: { fifaRanking: 24, nickname: "Los Canaleros", confederation: "CONCACAF" },
  TUN: { fifaRanking: 25, nickname: "Las Águilas de Cartago", confederation: "CAF" },
  CAN: { fifaRanking: 26, nickname: "Los Rojos", confederation: "CONCACAF" },
  NOR: { fifaRanking: 27, nickname: "Los Leones Vikingos", confederation: "UEFA" },
  ALG: { fifaRanking: 28, nickname: "Los Zorros del Desierto", confederation: "CAF" },
  MEX: { fifaRanking: 29, nickname: "El Tri", confederation: "CONCACAF" },
  PAR: { fifaRanking: 30, nickname: "La Albirroja", confederation: "CONMEBOL" },
  AUS: { fifaRanking: 31, nickname: "Los Socceroos", confederation: "AFC" },
  KSA: { fifaRanking: 32, nickname: "Los Halcones Verdes", confederation: "AFC" },
  QAT: { fifaRanking: 33, nickname: "El Annabi", confederation: "AFC" },
  TUR: { fifaRanking: 34, nickname: "Los de la Media Luna", confederation: "UEFA" },
  SWE: { fifaRanking: 35, nickname: "Blågult", confederation: "UEFA" },
  GHA: { fifaRanking: 36, nickname: "Las Estrellas Negras", confederation: "CAF" },
  UZB: { fifaRanking: 37, nickname: "Los Lobos Blancos", confederation: "AFC" },
  IRQ: { fifaRanking: 38, nickname: "Los Leones de Mesopotamia", confederation: "AFC" },
  CZE: { fifaRanking: 39, nickname: null, confederation: "UEFA" },
  BIH: { fifaRanking: 40, nickname: "Los Dragones", confederation: "UEFA" },
  JOR: { fifaRanking: 41, nickname: "Las Águilas de Nashama", confederation: "AFC" },
  NZL: { fifaRanking: 42, nickname: "Los All Whites", confederation: "OFC" },
  RSA: { fifaRanking: 43, nickname: "Bafana Bafana", confederation: "CAF" },
  COD: { fifaRanking: 44, nickname: "Los Leopardos", confederation: "CAF" },
  CPV: { fifaRanking: 45, nickname: "Los Tiburones Azules", confederation: "CAF" },
  HAI: { fifaRanking: 46, nickname: "Les Grenadiers", confederation: "CONCACAF" },
  CUW: { fifaRanking: 47, nickname: null, confederation: "CONCACAF" },
  SCO: { fifaRanking: 48, nickname: null, confederation: "UEFA" },
};

export function teamMetaForCode(code: string | null | undefined): TeamMeta | null {
  if (!code) return null;
  return TEAM_META_2026[code] ?? null;
}
