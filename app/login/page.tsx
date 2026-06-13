"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, ArrowRight } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const redirectTo = params.get("next");
  const errorParam = params.get("error");
  const nextQuery = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  // sentLink: "set-password" (cuenta transicional) | "login" (magic link login)
  const [sentLink, setSentLink] = useState<"set-password" | "login" | null>(
    null
  );

  useEffect(() => {
    if (errorParam === "invalid") {
      setError(t.auth.login.errorInvalidLink);
    } else if (errorParam === "missing") {
      setError(t.auth.login.errorMissingLink);
    }
  }, [errorParam, t]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          redirectTo: redirectTo || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || t.auth.login.errorDefault);
        return;
      }
      // Cuenta transicional sin contraseña: el server ha mandado un email
      // con un enlace para crearla. Mostramos panel "revisa tu correo".
      if (data.sentLink) {
        setSentLink("set-password");
        return;
      }
      router.push(redirectTo || "/groups");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t.auth.login.emailForLink);
      return;
    }
    setMagicLoading(true);
    try {
      const r = await fetch("/api/auth/magic-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          redirectTo: redirectTo || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || t.auth.login.errorNoLink);
        return;
      }
      setSentLink("login");
    } finally {
      setMagicLoading(false);
    }
  }

  if (sentLink) {
    const isMagic = sentLink === "login";
    return (
      <div className="pt-12 sm:pt-20 max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none">
            {t.auth.login.checkEmail}
          </h1>
          <p className="mt-5 text-pitch-500 dark:text-chalk-300">
            {isMagic ? (
              <>
                {t.auth.login.magicLinkSent.split("{email}")[0]}
                <strong>{email}</strong>
                {t.auth.login.magicLinkSent.split("{email}")[1]}
              </>
            ) : (
              <>
                {t.auth.login.transitionLinkSent.split("{email}")[0]}
                <strong>{email}</strong>
                {t.auth.login.transitionLinkSent.split("{email}")[1]}
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setSentLink(null);
            setPassword("");
          }}
          className="btn-secondary w-full"
        >
          {t.auth.login.goBack}
        </button>
      </div>
    );
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-6xl sm:text-7xl text-pitch-900 dark:text-chalk-50 leading-none">
          {t.auth.login.title}
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {t.auth.login.tagline}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="cromo bg-white dark:bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
        <div>
          <label className="flex items-center gap-1.5 text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
            <Mail size={12} strokeWidth={2.5} />
            {t.auth.login.emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base w-full"
            placeholder={t.auth.login.emailPlaceholder}
            required
            autoFocus
            autoComplete="email"
          />
        </div>

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={magicLoading || loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {magicLoading ? t.auth.login.sendingLink : t.auth.login.sendMagicLink}
          {!magicLoading && <ArrowRight size={16} strokeWidth={2.5} />}
        </button>

        <div className="flex items-center gap-3 text-[10px] text-pitch-500 dark:text-chalk-500 uppercase tracking-widest font-mono">
          <div className="flex-1 h-px bg-paper-200 dark:bg-pitch-700" />
          <span>{t.auth.login.orUsePassword}</span>
          <div className="flex-1 h-px bg-paper-200 dark:bg-pitch-700" />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
            <KeyRound size={12} strokeWidth={2.5} />
            {t.auth.login.passwordLabel}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base w-full"
            placeholder={t.auth.login.passwordPlaceholder}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || magicLoading || !password}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          {loading ? t.auth.login.loggingIn : t.auth.login.loginWithPassword}
          {!loading && <ArrowRight size={16} strokeWidth={2.5} />}
        </button>

        <div className="flex items-center justify-between text-xs text-pitch-500 dark:text-chalk-400">
          <Link
            href={`/forgot-password${nextQuery}`}
            className="hover:text-flame-400 underline underline-offset-2"
          >
            {t.auth.login.forgotPassword}
          </Link>
          <Link
            href={`/register${nextQuery}`}
            className="hover:text-flame-400 underline underline-offset-2"
          >
            {t.auth.login.createAccount}
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
