// Cliente HTTP de API-Football (api-sports.io · v3).
//
// La API devuelve siempre 200 con un campo `errors`. Si `errors` es un
// objeto no vacío, algo falló (rate limit, parámetro inválido, etc.).
// Aquí lo normalizamos a Error para que cualquier consumidor se entere.
//
// Requiere `API_FOOTBALL_KEY` en el entorno.

const API_BASE = "https://v3.football.api-sports.io";

function apiKey(): string {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error(
      "API_FOOTBALL_KEY no definido. Añade la API key de api-sports.io al entorno."
    );
  }
  return key;
}

type ApiResponse<T> = {
  get: string;
  parameters: Record<string, string>;
  errors: unknown;
  results: number;
  paging: { current: number; total: number };
  response: T[];
};

export type ApiGetOpts = {
  // Segundos para `next.revalidate`. Si se omite, `cache: "no-store"`.
  // Sin cache para scripts/cron (frescura siempre). Con cache para los
  // endpoints servidos al usuario (compartido entre todos los visitantes).
  revalidate?: number;
};

async function apiGet<T>(
  path: string,
  params: Record<string, string | number>,
  opts: ApiGetOpts = {}
): Promise<T[]> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const init: RequestInit & { next?: { revalidate: number } } = {
    headers: { "x-apisports-key": apiKey() },
  };
  if (typeof opts.revalidate === "number") {
    init.next = { revalidate: opts.revalidate };
  } else {
    init.cache = "no-store";
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(
      `API-Football ${path} → HTTP ${res.status}: ${await res.text()}`
    );
  }
  const data = (await res.json()) as ApiResponse<T>;
  const errs = data.errors;
  if (
    errs &&
    typeof errs === "object" &&
    !Array.isArray(errs) &&
    Object.keys(errs).length > 0
  ) {
    throw new Error(
      `API-Football ${path} → errores: ${JSON.stringify(errs)}`
    );
  }
  return data.response;
}

export type ApiTeamSummary = {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string | null;
    logo: string | null;
    founded: number | null;
    national: boolean;
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
    country: string | null;
    capacity: number | null;
  };
};

export type ApiFixtureStatus = {
  long: string;
  short: string; // "NS", "1H", "HT", "2H", "ET", "P", "FT", "AET", "PEN", "PST", "CANC", "ABD", "AWD", "WO", "LIVE"
  elapsed: number | null;
};

export type ApiFixture = {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string; // ISO
    timestamp: number;
    venue: { id: number | null; name: string | null; city: string | null };
    status: ApiFixtureStatus;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
};

export function getTeamsByLeague(leagueId: number, season: number) {
  return apiGet<ApiTeamSummary>("/teams", { league: leagueId, season });
}

export function getFixturesByLeague(leagueId: number, season: number) {
  return apiGet<ApiFixture>("/fixtures", { league: leagueId, season });
}

// Para el cron de auto-resultados: trae los partidos del rango pedido.
// Útil para evitar pedir las 100+ fixtures del Mundial entero cada vez.
export function getFixturesByDateRange(
  leagueId: number,
  season: number,
  fromIsoDate: string, // "YYYY-MM-DD"
  toIsoDate: string
) {
  return apiGet<ApiFixture>("/fixtures", {
    league: leagueId,
    season,
    from: fromIsoDate,
    to: toIsoDate,
  });
}

// ─── Endpoints de enriquecimiento (Fase 2) ───────────────────────────────

export type ApiLineupPlayer = {
  player: { id: number | null; name: string; number: number | null; pos: string | null; grid: string | null };
};

export type ApiLineup = {
  team: { id: number; name: string; logo: string; colors: unknown };
  coach: { id: number | null; name: string | null; photo: string | null };
  formation: string | null;
  startXI: ApiLineupPlayer[];
  substitutes: ApiLineupPlayer[];
};

export type ApiEvent = {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: "Goal" | "Card" | "subst" | "Var" | string;
  detail: string;
  comments: string | null;
};

// /standings devuelve un array con UN elemento (la "league") cuyo .standings
// es un array de grupos; cada grupo es un array de filas de equipos.
export type ApiStandingRow = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string;
  description: string | null;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  home: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  away: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  update: string;
};

export type ApiStandings = {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: ApiStandingRow[][];
  };
};

export function getFixtureLineups(fixtureId: number, opts: ApiGetOpts = {}) {
  return apiGet<ApiLineup>("/fixtures/lineups", { fixture: fixtureId }, opts);
}

export function getFixtureEvents(fixtureId: number, opts: ApiGetOpts = {}) {
  return apiGet<ApiEvent>("/fixtures/events", { fixture: fixtureId }, opts);
}

// last: cuántos partidos previos devolver (la API permite hasta ~100, con 10 sobra).
export function getHeadToHead(
  apiTeamIdA: number,
  apiTeamIdB: number,
  last: number,
  opts: ApiGetOpts = {}
) {
  return apiGet<ApiFixture>(
    "/fixtures/headtohead",
    { h2h: `${apiTeamIdA}-${apiTeamIdB}`, last },
    opts
  );
}

export function getStandings(
  leagueId: number,
  season: number,
  opts: ApiGetOpts = {}
) {
  return apiGet<ApiStandings>("/standings", { league: leagueId, season }, opts);
}

// ─── Helpers de estado del partido ────────────────────────────────────────

// Status de fixture que la API considera "el partido terminó con resultado válido"
// (no penaltis ganados en grupo, no aplazado, no cancelado).
export function isFinalScore(status: ApiFixtureStatus): boolean {
  return ["FT", "AET", "PEN"].includes(status.short);
}

// Status de fixture que la API considera "en juego ahora mismo".
export function isLive(status: ApiFixtureStatus): boolean {
  return ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status.short);
}

// Devuelve cuántos segundos cachear datos sobre un partido en función del
// estado: pre-partido lejano (10 min), próximo (1 min), en directo (30s),
// terminado (1h). El "score final ya en DB" sirve como proxy de "terminado"
// porque el cron de Fase 1 escribe ahí. Para datos que no cambian aunque el
// partido esté en directo (lineups, h2h), usa `liveTtl` mayor.
export function matchCacheTtl(
  kickoffAt: Date,
  hasFinalScore: boolean,
  opts?: { liveTtl?: number }
): number {
  if (hasFinalScore) return 3600;
  const now = Date.now();
  const ko = kickoffAt.getTime();
  const msSince = now - ko;
  // Empezado hace menos de 3h → considéralo en directo.
  if (msSince >= 0 && msSince < 3 * 60 * 60 * 1000) {
    return opts?.liveTtl ?? 30;
  }
  // Empezado hace más de 3h sin score final: la API tardará en marcar FT,
  // tratemos como "casi terminado".
  if (msSince >= 3 * 60 * 60 * 1000) return 600;
  // Pre-partido: cuanto más cerca, más frecuente.
  const minutesToKickoff = -msSince / 60000;
  if (minutesToKickoff <= 60) return 60;
  return 600;
}
