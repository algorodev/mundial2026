import type { Metadata } from "next";
import TournamentLanding from "@/components/TournamentLanding";
import { LANDINGS } from "@/lib/landings";

const cfg = LANDINGS["premier-league-2026-27"];

export const metadata: Metadata = {
  title: { absolute: cfg.seoTitle },
  description: cfg.seoDescription,
  keywords: cfg.keywords,
  alternates: { canonical: "/porra-premier-league-2026-27" },
  openGraph: {
    title: cfg.seoTitle,
    description: cfg.seoDescription,
    url: "/porra-premier-league-2026-27",
    type: "website",
    locale: "es_ES",
  },
};

export default function PremierLandingPage() {
  return <TournamentLanding cfg={cfg} />;
}
