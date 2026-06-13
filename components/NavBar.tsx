"use client";

import Image from "next/image";
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
    <nav className="border-b-2 border-pitch-950 bg-pitch-950/85 backdrop-blur-xs sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="group inline-flex items-center"
          aria-label="PorraBros"
        >
          <Image
            src="/brand/porrabros-logo-horizontal.svg"
            alt="PorraBros"
            width={200}
            height={48}
            priority
            unoptimized
            className="h-10 sm:h-12 w-auto group-hover:-translate-y-0.5 transition-transform"
            style={{ width: "auto" }}
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {session && (
            <>
              <Link
                href="/groups"
                className="text-xs text-chalk-100 hover:text-flame-400 transition-colors uppercase tracking-widest font-display"
              >
                Mis porras
              </Link>
              <Link
                href="/profile"
                className="text-xs text-chalk-100 hover:text-flame-400 transition-colors uppercase tracking-widest font-display truncate min-w-0 max-w-[8rem] sm:max-w-none"
              >
                {session.name ?? session.email.split("@")[0]}
              </Link>
              {session.isGlobalAdmin && (
                <Link
                  href="/admin"
                  className="shrink-0 text-xs text-pitch-950 bg-flame-500 hover:bg-flame-400 px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest font-display"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="shrink-0 text-xs text-chalk-400 hover:text-chalk-50 transition-colors uppercase tracking-widest font-mono"
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
