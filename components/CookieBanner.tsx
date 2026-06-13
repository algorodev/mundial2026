"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";

export const COOKIE_CONSENT_KEY = "porrabros-cookie-consent";
export const COOKIE_CONSENT_EVENT = "porrabros:cookie-consent";

export type ConsentValue = "accepted" | "rejected";

export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  return raw === "accepted" || raw === "rejected" ? raw : null;
}

function writeConsent(value: ConsentValue) {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(
    new CustomEvent<ConsentValue>(COOKIE_CONSENT_EVENT, { detail: value })
  );
}

export default function CookieBanner() {
  const { t } = useI18n();
  const [decided, setDecided] = useState<boolean>(true);

  useEffect(() => {
    setDecided(readConsent() !== null);
  }, []);

  if (decided) return null;

  function decide(value: ConsentValue) {
    writeConsent(value);
    setDecided(true);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.cookieBanner.ariaLabel}
      className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-50"
    >
      <div className="cromo bg-paper-50 dark:bg-pitch-800 text-pitch-950 dark:text-chalk-50 p-4 sm:p-5">
        <p className="font-display text-base sm:text-lg uppercase leading-tight">
          {t.cookieBanner.title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-pitch-800 dark:text-chalk-200">
          {t.cookieBanner.description}{" "}
          <Link
            href="/cookies"
            className="text-brick-500 hover:text-brick-600 underline underline-offset-2"
          >
            {t.cookieBanner.moreInfo}
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="bg-flame-500 hover:bg-flame-400 text-pitch-950 font-display
              px-4 py-2 rounded-md uppercase tracking-wide text-xs
              border-2 border-pitch-950 shadow-brutal-sm
              transition-all hover:-translate-x-0.5 hover:-translate-y-0.5
              active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {t.cookieBanner.accept}
          </button>
          <button
            type="button"
            onClick={() => decide("rejected")}
            className="bg-paper-100 hover:bg-paper-200 dark:bg-pitch-700 dark:hover:bg-pitch-600 text-pitch-950 dark:text-chalk-50 font-display
              px-4 py-2 rounded-md uppercase tracking-wide text-xs
              border-2 border-pitch-950 shadow-brutal-sm
              transition-all hover:-translate-x-0.5 hover:-translate-y-0.5
              active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {t.cookieBanner.reject}
          </button>
        </div>
      </div>
    </div>
  );
}
