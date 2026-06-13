"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, KeyRound, ArrowRight } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

const PASSWORD_MIN = 8;

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const redirectTo = params.get("next");
  const nextQuery = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || t.auth.register.errorDefault);
        return;
      }
      router.push(redirectTo || "/groups");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-6xl sm:text-7xl text-pitch-900 dark:text-chalk-50 leading-none">
          {t.auth.register.title}
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {t.auth.register.tagline}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="cromo bg-white dark:bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
        <div>
          <label className="flex items-center gap-1.5 text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
            <User size={12} strokeWidth={2.5} />
            {t.auth.register.nameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base w-full"
            placeholder={t.auth.register.namePlaceholder}
            required
            maxLength={60}
            autoFocus
            autoComplete="name"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
            <Mail size={12} strokeWidth={2.5} />
            {t.auth.register.emailLabel}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base w-full"
            placeholder={t.auth.register.emailPlaceholder}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
            <KeyRound size={12} strokeWidth={2.5} />
            {t.auth.register.passwordLabel}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base w-full"
            placeholder={t.auth.register.passwordPlaceholder}
            required
            minLength={PASSWORD_MIN}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
            ⚠️ {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? t.auth.register.submitting : t.auth.register.submit}
          {!loading && <ArrowRight size={16} strokeWidth={2.5} />}
        </button>

        <p className="text-xs text-pitch-500 dark:text-chalk-400 text-center">
          {t.auth.register.alreadyHaveAccount}{" "}
          <Link
            href={`/login${nextQuery}`}
            className="hover:text-flame-400 underline underline-offset-2"
          >
            {t.auth.register.login}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
