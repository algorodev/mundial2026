import type { Metadata } from "next";
import TournamentLanding from "@/components/TournamentLanding";
import { LANDINGS } from "@/lib/landings";

const cfg = LANDINGS["champions-2025-26"];

export const metadata: Metadata = {
  title: { absolute: cfg.seoTitle },
  description: cfg.seoDescription,
  keywords: cfg.keywords,
  alternates: { canonical: "/porra-champions-2025-26" },
  openGraph: {
    title: cfg.seoTitle,
    description: cfg.seoDescription,
    url: "/porra-champions-2025-26",
    type: "website",
    locale: "es_ES",
  },
};

export default function ChampionsLandingPage() {
  return <TournamentLanding cfg={cfg} />;
}
