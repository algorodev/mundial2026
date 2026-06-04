import type { Metadata } from "next";
import TournamentLanding from "@/components/TournamentLanding";
import { LANDINGS } from "@/lib/landings";

const cfg = LANDINGS["nba-2026-27"];

export const metadata: Metadata = {
  title: { absolute: cfg.seoTitle },
  description: cfg.seoDescription,
  keywords: cfg.keywords,
  alternates: { canonical: "/porra-nba-2026-27" },
  openGraph: {
    title: cfg.seoTitle,
    description: cfg.seoDescription,
    url: "/porra-nba-2026-27",
    type: "website",
    locale: "es_ES",
  },
};

export default function NbaLandingPage() {
  return <TournamentLanding cfg={cfg} />;
}
