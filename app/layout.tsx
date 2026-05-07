import "./globals.css";
import type { Metadata, Viewport } from "next";
import { getSession } from "@/lib/session";
import NavBar from "@/components/NavBar";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PorraBros · Porras de deportes entre amigos",
    template: "%s · PorraBros",
  },
  description:
    "Crea una porra con tu pandilla, invita por enlace y compite con tus pronósticos.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "PorraBros",
    title: "PorraBros · Porras de deportes entre amigos",
    description:
      "Crea una porra con tu pandilla, invita por enlace y compite con tus pronósticos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PorraBros",
    description: "Porras de deportes entre amigos",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFD23F",
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
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">{children}</main>
        <footer className="text-center text-chalk-400 text-xs py-10 font-mono uppercase tracking-widest">
          ⚽ PorraBros · Hecho con ☕
        </footer>
      </body>
    </html>
  );
}
