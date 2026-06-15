"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

export default function MagicLoginClient({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/magic-login/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || t.auth.magicLogin.errorDefault);
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
          {t.auth.magicLogin.title}
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
          {t.auth.magicLogin.description.split("{email}")[0]}
          <strong>{email}</strong>
          {t.auth.magicLogin.description.split("{email}")[1]}
        </p>

        {error && (
          <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
            ⚠️ {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? t.auth.magicLogin.submitting : t.auth.magicLogin.submit}
          {!loading && <ArrowRight size={18} strokeWidth={2.5} />}
        </button>
      </form>
    </div>
  );
}
