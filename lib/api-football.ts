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

async function apiGet<T>(
  path: string,
  params: Record<string, string | number>
): Promise<T[]> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: { "x-apisports-key": apiKey() },
    cache: "no-store",
  });
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

// Status de fixture que la API considera "el partido terminó con resultado válido"
// (no penaltis ganados en grupo, no aplazado, no cancelado).
export function isFinalScore(status: ApiFixtureStatus): boolean {
  return ["FT", "AET", "PEN"].includes(status.short);
}

// Status de fixture que la API considera "en juego ahora mismo".
export function isLive(status: ApiFixtureStatus): boolean {
  return ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(status.short);
}
