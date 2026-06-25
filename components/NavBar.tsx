"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Globe,
  Sun,
  Moon,
  LogOut,
  Shield,
  LayoutGrid,
  UserCircle,
} from "lucide-react";
import type { SessionPayload } from "@/lib/session";
import { useI18n } from "@/providers/I18nProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { PwaInstallGuide } from "@/components/PwaInstallGuide";

export default function NavBar({
  session,
}: {
  session: SessionPayload | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const close = () => setOpen(false);

  const nextLocale = locale === "es" ? "en" : "es";
  const switchLabel = locale === "es" ? t.nav.switchToEn : t.nav.switchToEs;
  const themeLabel = theme === "dark" ? t.nav.lightMode : t.nav.darkMode;

  return (
    <nav className="border-b-2 border-pitch-950 dark:bg-pitch-950/95 bg-paper-50/95 backdrop-blur-xs sticky top-0 z-30 relative">
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
                className="text-xs dark:text-chalk-100 text-pitch-800 hover:text-flame-400 transition-colors uppercase tracking-widest font-display"
              >
                {t.nav.myPools}
              </Link>
              <Link
                href="/profile"
                className="text-xs dark:text-chalk-100 text-pitch-800 hover:text-flame-400 transition-colors uppercase tracking-widest font-display truncate min-w-0 max-w-[12rem]"
              >
                {session.name ?? session.email.split("@")[0]}
              </Link>
              {session.isGlobalAdmin && (
                <Link
                  href="/admin"
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs text-pitch-950 bg-flame-500 hover:bg-flame-400 px-3 py-1.5 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest font-display"
                >
                  <Shield size={12} strokeWidth={2.5} />
                  {t.nav.admin}
                </Link>
              )}
              <button
                onClick={logout}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs dark:text-chalk-400 text-pitch-500 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors uppercase tracking-widest font-mono"
                aria-label={t.nav.closeSession}
              >
                <LogOut size={13} strokeWidth={2} />
                {t.nav.logout}
              </button>
            </>
          )}
          {!session && (
            <Link
              href="/login"
              className="text-xs bg-flame-500 hover:bg-flame-400 text-pitch-950 font-display px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest hover:-translate-y-0.5 transition-transform"
            >
              {t.nav.enter}
            </Link>
          )}

          {/* Separator + Language toggle */}
          <span aria-hidden="true" className="text-xs dark:text-chalk-400 text-pitch-500 font-mono">|</span>
          <button
            onClick={() => setLocale(nextLocale)}
            className="shrink-0 inline-flex items-center gap-1 text-xs dark:text-chalk-400 text-pitch-500 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors uppercase tracking-widest font-mono"
            aria-label={switchLabel}
          >
            <Globe size={13} strokeWidth={2} />
            {locale === "es" ? "EN" : "ES"}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="shrink-0 dark:text-chalk-400 text-pitch-500 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors"
            aria-label={themeLabel}
          >
            {theme === "dark" ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
          </button>
        </div>

        {/* Mobile: botón entrar (sin sesión) o hamburger (con sesión) */}
        <div className="sm:hidden flex items-center gap-2">
          {!session && (
            <>
              <button
                onClick={() => setLocale(nextLocale)}
                className="dark:text-chalk-400 text-pitch-500 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors p-1"
                aria-label={switchLabel}
              >
                <Globe size={16} strokeWidth={2} />
              </button>
              <button
                onClick={toggleTheme}
                className="dark:text-chalk-400 text-pitch-500 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors p-1"
                aria-label={themeLabel}
              >
                {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
              </button>
              <PwaInstallGuide variant="icon" />
              <Link
                href="/login"
                className="text-xs bg-flame-500 hover:bg-flame-400 text-pitch-950 font-display px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest"
              >
                {t.nav.enter}
              </Link>
            </>
          )}
          {session && (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={open}
              className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] dark:text-chalk-100 text-pitch-800"
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
          className={`sm:hidden absolute left-0 right-0 top-full border-t-2 dark:border-pitch-800 border-paper-200 dark:bg-pitch-950/95 bg-paper-50/95 backdrop-blur-sm shadow-2xl transition-all duration-200 ease-out ${
            open
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="flex flex-col dark:divide-pitch-800 divide-paper-200 divide-y">
            <Link
              href="/groups"
              onClick={close}
              className="px-6 py-4 flex items-center gap-3 font-display text-xl uppercase tracking-widest dark:text-chalk-50 text-pitch-900 dark:hover:bg-pitch-800 hover:bg-paper-100 hover:text-flame-400 transition-colors"
            >
              <LayoutGrid size={20} strokeWidth={2} />
              {t.nav.myPools}
            </Link>
            <Link
              href="/profile"
              onClick={close}
              className="px-6 py-4 flex items-center gap-3 font-display text-xl uppercase tracking-widest dark:text-chalk-50 text-pitch-900 dark:hover:bg-pitch-800 hover:bg-paper-100 hover:text-flame-400 transition-colors"
            >
              <UserCircle size={20} strokeWidth={2} />
              {session.name ?? session.email.split("@")[0]}
            </Link>
            {session.isGlobalAdmin && (
              <Link
                href="/admin"
                onClick={close}
                className="px-6 py-4 flex items-center gap-3 font-display text-xl uppercase tracking-widest text-pitch-600 dark:text-flame-400 dark:hover:bg-pitch-800 hover:bg-paper-100 transition-colors"
              >
                <Shield size={20} strokeWidth={2} />
                {t.nav.admin}
              </Link>
            )}

            {/* Language toggle (mobile) */}
            <button
              onClick={() => { setLocale(nextLocale); close(); }}
              className="w-full text-left px-6 py-4 flex items-center gap-3 font-mono text-sm uppercase tracking-widest dark:text-chalk-400 text-pitch-500 dark:hover:bg-pitch-800 hover:bg-paper-100 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors"
              aria-label={switchLabel}
            >
              <Globe size={18} strokeWidth={2} />
              {locale === "es" ? "English" : "Español"}
            </button>

            {/* Theme toggle (mobile) */}
            <button
              onClick={() => { toggleTheme(); close(); }}
              className="w-full text-left px-6 py-4 flex items-center gap-3 font-mono text-sm uppercase tracking-widest dark:text-chalk-400 text-pitch-500 dark:hover:bg-pitch-800 hover:bg-paper-100 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors"
              aria-label={themeLabel}
            >
              {theme === "dark" ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
              {themeLabel}
            </button>

            <PwaInstallGuide variant="item" onBeforeOpen={close} />

            <button
              onClick={logout}
              className="w-full text-left px-6 py-4 flex items-center gap-3 font-mono text-sm uppercase tracking-widest dark:text-chalk-400 text-pitch-500 dark:hover:bg-pitch-800 hover:bg-paper-100 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors"
            >
              <LogOut size={18} strokeWidth={2} />
              {t.nav.closeSession}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
