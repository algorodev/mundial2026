"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

const PASSWORD_MIN = 8;

export default function SetPasswordClient({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t.auth.setPassword.errorMismatch);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || t.auth.setPassword.errorDefault);
        return;
      }
      const dest = typeof data.redirectTo === "string" ? data.redirectTo : "/groups";
      router.push(dest);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl sm:text-6xl text-pitch-900 dark:text-chalk-50 leading-none">
          {t.auth.setPassword.title}
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {email}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="cromo bg-white dark:bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
        <p className="text-pitch-600 dark:text-chalk-200 text-sm leading-relaxed">
          {t.auth.setPassword.description.replace("{min}", String(PASSWORD_MIN))}
        </p>

        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
            {t.auth.setPassword.newPasswordLabel}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base w-full"
            placeholder="••••••••"
            required
            minLength={PASSWORD_MIN}
            autoFocus
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-pitch-700 dark:text-flame-400 mb-2">
            {t.auth.setPassword.confirmPasswordLabel}
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-base w-full"
            placeholder="••••••••"
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
          {loading ? t.auth.setPassword.submitting : t.auth.setPassword.submit}
          {!loading && <ArrowRight size={18} strokeWidth={2.5} />}
        </button>
      </form>
    </div>
  );
}
