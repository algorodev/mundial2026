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
    <nav className="border-b-2 border-pitch-950 bg-pitch-950/85 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-flame-500 flex items-center justify-center text-pitch-950 text-xl border-2 border-pitch-950 shadow-brutal-sm group-hover:rotate-12 group-hover:-translate-y-0.5 transition-transform rounded">
            ⚽
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl text-chalk-50 tracking-tight">
              LA PORRA
            </span>
            <span className="font-mono text-[10px] text-flame-400 uppercase tracking-widest">
              Mundial 2026
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {session && (
            <>
              <Link
                href="/predictions"
                className="hidden sm:inline text-xs text-chalk-100 hover:text-flame-400 transition-colors uppercase tracking-widest font-display"
              >
                Pronósticos
              </Link>
              <Link
                href="/leaderboard"
                className="text-xs text-chalk-100 hover:text-flame-400 transition-colors uppercase tracking-widest font-display"
              >
                Clasificación
              </Link>
              {session.isAdmin && (
                <Link
                  href="/admin"
                  className="text-xs text-pitch-950 bg-flame-500 hover:bg-flame-400 px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest font-display"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="text-xs text-chalk-400 hover:text-chalk-50 transition-colors uppercase tracking-widest font-mono"
                aria-label="Cerrar sesión"
              >
                Salir
              </button>
            </>
          )}
          {!session && (
            <Link
              href="/login"
              className="text-xs bg-flame-500 hover:bg-flame-400 text-pitch-950 font-display px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest hover:-translate-y-0.5 transition-transform"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
