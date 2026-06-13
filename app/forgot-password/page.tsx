"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/providers/I18nProvider";

function ForgotPasswordInner() {
  const params = useSearchParams();
  const { t } = useI18n();
  const redirectTo = params.get("next");
  const nextQuery = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo: redirectTo || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || t.auth.forgotPassword.errorDefault);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="pt-12 sm:pt-20 max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none">
            {t.auth.forgotPassword.checkEmail}
          </h1>
          <p className="mt-5 text-pitch-500 dark:text-chalk-300">
            {t.auth.forgotPassword.sentDescription.split("{email}")[0]}
            <strong>{email}</strong>
            {t.auth.forgotPassword.sentDescription.split("{email}")[1]}
          </p>
        </div>
        <Link href={`/login${nextQuery}`} className="btn-secondary w-full block text-center">
          {t.auth.forgotPassword.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none">
          {t.auth.forgotPassword.title}
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {t.auth.forgotPassword.tagline}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="cromo bg-white dark:bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
        <p className="text-pitch-600 dark:text-chalk-200 text-sm leading-relaxed">
          {t.auth.forgotPassword.description}
        </p>

        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
            {t.auth.forgotPassword.emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base w-full"
            placeholder={t.auth.forgotPassword.emailPlaceholder}
            required
            autoFocus
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
            ⚠️ {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t.auth.forgotPassword.submitting : t.auth.forgotPassword.submit}
        </button>

        <p className="text-xs text-pitch-500 dark:text-chalk-400 text-center">
          <Link
            href={`/login${nextQuery}`}
            className="hover:text-flame-400 underline underline-offset-2"
          >
            {t.auth.forgotPassword.backToLogin}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}
