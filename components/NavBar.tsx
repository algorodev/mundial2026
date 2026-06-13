"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionPayload } from "@/lib/session";

export default function NavBar({
  session,
}: {
  session: SessionPayload | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const close = () => setOpen(false);

  return (
    <nav className="border-b-2 border-pitch-950 bg-pitch-950/95 backdrop-blur-xs sticky top-0 z-30 relative">
      {/* Barra principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href="/"
          onClick={close}
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

        {/* Desktop nav (sm+) */}
        <div className="hidden sm:flex items-center gap-4 min-w-0">
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
                className="text-xs text-chalk-100 hover:text-flame-400 transition-colors uppercase tracking-widest font-display truncate min-w-0 max-w-[12rem]"
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

        {/* Mobile: botón entrar (sin sesión) o hamburger (con sesión) */}
        <div className="sm:hidden flex items-center">
          {!session && (
            <Link
              href="/login"
              className="text-xs bg-flame-500 hover:bg-flame-400 text-pitch-950 font-display px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest"
            >
              Entrar
            </Link>
          )}
          {session && (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] text-chalk-100"
            >
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-200 ${open ? "rotate-45 translate-y-[7px]" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-200 ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-all duration-200 ${open ? "-rotate-45 -translate-y-[7px]" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Panel mobile — overlay absoluto, siempre en DOM para animar */}
      {session && (
        <div
          aria-hidden={!open}
          className={`sm:hidden absolute left-0 right-0 top-full border-t-2 border-pitch-800 bg-pitch-950/95 backdrop-blur-sm shadow-2xl transition-all duration-200 ease-out ${
            open
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="flex flex-col divide-y divide-pitch-800">
            <Link
              href="/groups"
              onClick={close}
              className="px-6 py-4 font-display text-xl uppercase tracking-widest text-chalk-50 hover:bg-pitch-800 hover:text-flame-400 transition-colors"
            >
              Mis porras
            </Link>
            <Link
              href="/profile"
              onClick={close}
              className="px-6 py-4 font-display text-xl uppercase tracking-widest text-chalk-50 hover:bg-pitch-800 hover:text-flame-400 transition-colors"
            >
              {session.name ?? session.email.split("@")[0]}
            </Link>
            {session.isGlobalAdmin && (
              <Link
                href="/admin"
                onClick={close}
                className="px-6 py-4 font-display text-xl uppercase tracking-widest text-flame-400 hover:bg-pitch-800 transition-colors"
              >
                Admin
              </Link>
            )}
            <button
              onClick={logout}
              className="w-full text-left px-6 py-4 font-mono text-sm uppercase tracking-widest text-chalk-400 hover:bg-pitch-800 hover:text-chalk-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
