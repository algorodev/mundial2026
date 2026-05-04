import "./globals.css";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "La Porra · Mundial 2026",
  description: "Porra del Mundial 2026 entre amigos",
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
        <footer className="text-center text-chalk-400 text-xs py-8 font-mono">
          ⚽ La Porra · Mundial 2026 · Hecho con ☕ en Pedralba
        </footer>
      </body>
    </html>
  );
}
