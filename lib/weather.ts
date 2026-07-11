// Cliente de Open-Meteo (https://open-meteo.com) — API pública gratuita sin
// API key. Se usa para el clima previsto de la sede de cada partido.
//
// Open-Meteo solo da forecast horario para los próximos ~16 días, así que
// getVenueWeather devuelve null si el kickoff está fuera de esa ventana o ya
// pasó (no tiene sentido "pronosticar" un partido ya jugado).
//
// Cache: usamos el cache de fetch de Next (`next.revalidate`), igual que
// lib/api-football.ts — el clima no cambia por minuto, así que 1h es de sobra
// y evita gastar cuota por cada usuario que abra la ficha del partido.

const WEATHER_BASE = "https://api.open-meteo.com/v1/forecast";
const FORECAST_WINDOW_MS = 16 * 24 * 60 * 60 * 1000; // ~16 días, límite de Open-Meteo

export type VenueWeather = {
  tempC: number;
  code: number;
  label: string;
  emoji: string;
};

// Traducción reducida de los weathercode WMO que usa Open-Meteo.
// https://open-meteo.com/en/docs#weathervariables
const WMO_LABELS: Record<number, { label: string; emoji: string }> = {
  0: { label: "Despejado", emoji: "☀️" },
  1: { label: "Mayormente despejado", emoji: "🌤" },
  2: { label: "Parcialmente nublado", emoji: "⛅" },
  3: { label: "Nublado", emoji: "☁️" },
  45: { label: "Niebla", emoji: "🌫" },
  48: { label: "Niebla helada", emoji: "🌫" },
  51: { label: "Llovizna ligera", emoji: "🌦" },
  53: { label: "Llovizna", emoji: "🌦" },
  55: { label: "Llovizna densa", emoji: "🌧" },
  61: { label: "Lluvia ligera", emoji: "🌧" },
  63: { label: "Lluvia", emoji: "🌧" },
  65: { label: "Lluvia fuerte", emoji: "🌧" },
  71: { label: "Nieve ligera", emoji: "🌨" },
  73: { label: "Nieve", emoji: "🌨" },
  75: { label: "Nieve fuerte", emoji: "❄️" },
  80: { label: "Chubascos ligeros", emoji: "🌦" },
  81: { label: "Chubascos", emoji: "🌧" },
  82: { label: "Chubascos fuertes", emoji: "⛈" },
  95: { label: "Tormenta", emoji: "⛈" },
  96: { label: "Tormenta con granizo", emoji: "⛈" },
  99: { label: "Tormenta fuerte con granizo", emoji: "⛈" },
};

function labelFor(code: number): { label: string; emoji: string } {
  return WMO_LABELS[code] ?? { label: "—", emoji: "🌡" };
}

type OpenMeteoResponse = {
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
};

export async function getVenueWeather(
  lat: number,
  lon: number,
  kickoffIso: string,
  opts: { revalidate?: number } = {}
): Promise<VenueWeather | null> {
  const kickoff = new Date(kickoffIso).getTime();
  const now = Date.now();
  if (Number.isNaN(kickoff) || kickoff < now || kickoff - now > FORECAST_WINDOW_MS) {
    return null;
  }

  const url = new URL(WEATHER_BASE);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "UTC");

  const res = await fetch(url, {
    next: { revalidate: opts.revalidate ?? 3600 },
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo → HTTP ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as OpenMeteoResponse;

  // Buscamos la hora del forecast más cercana al kickoff (Open-Meteo da
  // horas exactas en punto; el kickoff casi nunca cae justo en una).
  const kickoffDate = new Date(kickoffIso);
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < data.hourly.time.length; i++) {
    const diff = Math.abs(new Date(data.hourly.time[i] + "Z").getTime() - kickoffDate.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) return null;

  const code = data.hourly.weather_code[bestIdx];
  const { label, emoji } = labelFor(code);
  return {
    tempC: Math.round(data.hourly.temperature_2m[bestIdx]),
    code,
    label,
    emoji,
  };
}
