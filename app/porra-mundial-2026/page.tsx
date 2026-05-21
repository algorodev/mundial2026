import type { Metadata } from "next";
import TournamentLanding from "@/components/TournamentLanding";
import { LANDINGS } from "@/lib/landings";

const cfg = LANDINGS["mundial-2026"];

export const metadata: Metadata = {
  title: cfg.seoTitle,
  description: cfg.seoDescription,
  keywords: cfg.keywords,
  alternates: { canonical: "/porra-mundial-2026" },
  openGraph: {
    title: cfg.seoTitle,
    description: cfg.seoDescription,
    url: "/porra-mundial-2026",
    type: "website",
    locale: "es_ES",
  },
};

export default function MundialLandingPage() {
  return <TournamentLanding cfg={cfg} />;
}
