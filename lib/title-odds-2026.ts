// Probabilidad de campeón por selección — Mundial 2026.
// Snapshot as-of 2026-07-11: cifras ORIENTATIVAS (no vienen de ninguna casa
// de apuestas ni modelo en vivo, y no se actualizan solas). Es una
// referencia informativa para el "Forecast" de la porra — NUNCA afecta a la
// puntuación ni a la lógica de negocio. Si se quiere una fuente real,
// sustituir por un snapshot de odds públicas, fechado igual que este.

export const TITLE_ODDS_SNAPSHOT_DATE = "2026-07-11";

export const TITLE_ODDS_2026: Record<string, number> = {
  ARG: 14.5, FRA: 13.0, ESP: 12.0, ENG: 10.5, BRA: 9.5,
  POR: 7.0, NED: 5.5, BEL: 4.0, GER: 4.0, COL: 2.5,
  CRO: 2.2, MAR: 2.0, URU: 1.8, USA: 1.5, SUI: 1.2,
  JPN: 1.0, SEN: 0.9, IRN: 0.7, KOR: 0.7, ECU: 0.6,
  AUT: 0.5, CIV: 0.5, EGY: 0.4, MEX: 0.4, PAN: 0.3,
  TUN: 0.3, CAN: 0.3, NOR: 0.3, TUR: 0.3, ALG: 0.25,
  PAR: 0.2, AUS: 0.2, SWE: 0.2, KSA: 0.15, QAT: 0.15,
  GHA: 0.15, CZE: 0.15, RSA: 0.15, SCO: 0.15, UZB: 0.1,
  IRQ: 0.1, BIH: 0.1, JOR: 0.1, NZL: 0.1, COD: 0.1,
  CPV: 0.1, HAI: 0.05, CUW: 0.05,
};

export function titleOddsSorted(): { code: string; pct: number }[] {
  return Object.entries(TITLE_ODDS_2026)
    .map(([code, pct]) => ({ code, pct }))
    .sort((a, b) => b.pct - a.pct);
}
