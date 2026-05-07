import "./globals.css";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "PorraBros · Porras de deportes entre amigos",
  description:
    "Crea una porra con tu pandilla, invita por enlace y compite con tus pronósticos.",
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
