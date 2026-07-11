// Sedes del Mundial 2026 (16 ciudades, México/Canadá/EE. UU.).
// Snapshot as-of 2026-07-11: aforo aproximado del estadio anfitrión y
// coordenadas del recinto (para el clima, ver lib/weather.ts). Dato estático,
// no se sincroniza con ninguna API — si cambia el aforo real, actualizar aquí.
//
// La clave es el string libre que usamos en matches.stadium (que en nuestros
// datos guarda la CIUDAD anfitriona, no el nombre del estadio — ver
// lib/matches-data.ts). venueForStadium() hace el lookup tolerante a null.

export type VenueMeta = {
  stadiumName: string;
  city: string;
  country: string;
  capacity: number;
  lat: number;
  lon: number;
};

export const VENUES_2026: Record<string, VenueMeta> = {
  "Ciudad de México": {
    stadiumName: "Estadio Banorte (Azteca)",
    city: "Ciudad de México",
    country: "México",
    capacity: 87523,
    lat: 19.3029,
    lon: -99.1505,
  },
  "Guadalajara": {
    stadiumName: "Estadio Akron",
    city: "Guadalajara",
    country: "México",
    capacity: 48071,
    lat: 20.6822,
    lon: -103.4622,
  },
  "Monterrey": {
    stadiumName: "Estadio BBVA",
    city: "Monterrey",
    country: "México",
    capacity: 53500,
    lat: 25.6893,
    lon: -100.2917,
  },
  "Toronto": {
    stadiumName: "BMO Field",
    city: "Toronto",
    country: "Canadá",
    capacity: 45736,
    lat: 43.6332,
    lon: -79.4185,
  },
  "Vancouver": {
    stadiumName: "BC Place",
    city: "Vancouver",
    country: "Canadá",
    capacity: 54500,
    lat: 49.2768,
    lon: -123.1119,
  },
  "Los Ángeles": {
    stadiumName: "SoFi Stadium",
    city: "Inglewood, Los Ángeles",
    country: "EE. UU.",
    capacity: 70240,
    lat: 33.9535,
    lon: -118.3392,
  },
  "Bahía de San Francisco": {
    stadiumName: "Levi's Stadium",
    city: "Santa Clara, Bahía de San Francisco",
    country: "EE. UU.",
    capacity: 68500,
    lat: 37.403,
    lon: -121.97,
  },
  "Seattle": {
    stadiumName: "Lumen Field",
    city: "Seattle",
    country: "EE. UU.",
    capacity: 69000,
    lat: 47.5952,
    lon: -122.3316,
  },
  "Kansas City": {
    stadiumName: "Arrowhead Stadium",
    city: "Kansas City",
    country: "EE. UU.",
    capacity: 76416,
    lat: 39.0489,
    lon: -94.4839,
  },
  "Dallas": {
    stadiumName: "AT&T Stadium",
    city: "Arlington, Dallas",
    country: "EE. UU.",
    capacity: 80000,
    lat: 32.7473,
    lon: -97.0945,
  },
  "Houston": {
    stadiumName: "NRG Stadium",
    city: "Houston",
    country: "EE. UU.",
    capacity: 72220,
    lat: 29.6847,
    lon: -95.4107,
  },
  "Miami": {
    stadiumName: "Hard Rock Stadium",
    city: "Miami Gardens, Miami",
    country: "EE. UU.",
    capacity: 64767,
    lat: 25.958,
    lon: -80.2389,
  },
  "Atlanta": {
    stadiumName: "Mercedes-Benz Stadium",
    city: "Atlanta",
    country: "EE. UU.",
    capacity: 71000,
    lat: 33.7554,
    lon: -84.4008,
  },
  "Nueva York/Nueva Jersey": {
    stadiumName: "MetLife Stadium",
    city: "East Rutherford, Nueva York/Nueva Jersey",
    country: "EE. UU.",
    capacity: 82500,
    lat: 40.8135,
    lon: -74.0745,
  },
  "Boston": {
    stadiumName: "Gillette Stadium",
    city: "Foxborough, Boston",
    country: "EE. UU.",
    capacity: 65878,
    lat: 42.0909,
    lon: -71.2643,
  },
  "Filadelfia": {
    stadiumName: "Lincoln Financial Field",
    city: "Filadelfia",
    country: "EE. UU.",
    capacity: 69796,
    lat: 39.9008,
    lon: -75.1675,
  },
};

export function venueForStadium(stadium: string | null | undefined): VenueMeta | null {
  if (!stadium) return null;
  return VENUES_2026[stadium] ?? null;
}
