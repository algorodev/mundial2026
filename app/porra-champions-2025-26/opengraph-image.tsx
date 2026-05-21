import { LANDINGS } from "@/lib/landings";
import {
  ogContentType,
  ogSize,
  renderLandingOg,
} from "@/components/LandingOgImage";

export const runtime = "nodejs";
export const alt = "Porra Champions League 2025-26 en PorraBros";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return renderLandingOg(LANDINGS["champions-2025-26"]);
}
