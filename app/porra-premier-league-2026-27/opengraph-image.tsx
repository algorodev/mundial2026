import { LANDINGS } from "@/lib/landings";
import {
  ogContentType,
  ogSize,
  renderLandingOg,
} from "@/components/LandingOgImage";

export const runtime = "nodejs";
export const alt = "Porra Premier League 2026-27 en PorraBros";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderLandingOg(LANDINGS["premier-league-2026-27"]);
}
