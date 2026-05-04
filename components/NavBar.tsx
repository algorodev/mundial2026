"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/session";

export default function NavBar({
  session,
}: {
  session: SessionPayload | null;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="border-b border-pitch-800 bg-pitch-950/70 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-flame-500 flex items-center justify-center text-pitch-950 font-bold text-lg shadow-glow group-hover:rotate-12 transition-transform">
            ⚽
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl text-chalk-50 tracking-wider">
              La Porra
            </span>
            <span className="font-mono text-[10px] text-grass-400 uppercase tracking-widest">
              Mundial 2026
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {session && (
            <>
              <Link
                href="/predictions"
                className="hidden sm:inline text-sm text-chalk-100 hover:text-flame-400 transition-colors uppercase tracking-wide font-semibold"
              >
                Mis Pronósticos
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm text-chalk-100 hover:text-flame-400 transition-colors uppercase tracking-wide font-semibold"
              >
                Clasificación
              </Link>
              {session.isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm text-flame-400 hover:text-flame-500 transition-colors uppercase tracking-wide font-semibold border border-flame-500/40 px-3 py-1 rounded"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm text-chalk-400 hover:text-chalk-50 transition-colors"
                aria-label="Cerrar sesión"
              >
                Salir
              </button>
            </>
          )}
          {!session && (
            <Link
              href="/login"
              className="text-sm bg-flame-500 hover:bg-flame-400 text-pitch-950 font-bold px-4 py-2 rounded-lg uppercase tracking-wide transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
