import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import NavBar from "@/components/NavBar";
import WhatsNewModal from "@/components/WhatsNewModal";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

const TITLE = "PorraBros · Porras de deportes entre amigos";
const DESCRIPTION =
  "Crea una porra con tu pandilla, compañeros de oficina o familia. Elige torneo (Mundial 2026, Champions, LaLiga…), invita por enlace y compite con tus pronósticos en tiempo real.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: "%s · PorraBros",
  },
  description: DESCRIPTION,
  applicationName: "PorraBros",
  generator: "Next.js",
  manifest: "/manifest.json",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, telephone: false, address: false },
  authors: [{ name: "PorraBros" }],
  creator: "PorraBros",
  publisher: "PorraBros",
  category: "sports",
  keywords: [
    "porra",
    "porras",
    "porra entre amigos",
    "porra fútbol",
    "porra Mundial 2026",
    "porra Champions League",
    "porra LaLiga",
    "pronósticos deportivos",
    "quiniela",
    "PorraBros",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "PorraBros",
    title: TITLE,
    description: DESCRIPTION,
    // Next 14 sirve automáticamente app/opengraph-image.png; lo declaramos
    // explícitamente para asegurar dimensions/alt en cualquier scraper.
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 1200,
        alt: "PorraBros — porras de deportes entre amigos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@porrabros",
    creator: "@porrabros",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFD23F" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <html lang="es">
      <body className="min-h-screen">
        <NavBar session={session} />
        {session && <WhatsNewModal />}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">{children}</main>
        <footer className="text-center text-chalk-400 text-xs py-10 font-mono uppercase tracking-widest space-y-3">
          <div>⚽ PorraBros · Hecho con ☕</div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href="/about"
              className="hover:text-flame-400 underline underline-offset-4"
            >
              Sobre nosotros
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/privacidad"
              className="hover:text-flame-400 underline underline-offset-4"
            >
              Privacidad
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/terminos"
              className="hover:text-flame-400 underline underline-offset-4"
            >
              Términos
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/cookies"
              className="hover:text-flame-400 underline underline-offset-4"
            >
              Cookies
            </Link>
          </nav>
        </footer>
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
