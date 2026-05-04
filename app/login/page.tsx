"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error");
        return;
      }
      if (data.user.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/predictions");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-6xl sm:text-7xl text-chalk-50 leading-none">
          ENTRAR
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Pide tu nombre y PIN al organizador
        </p>
      </div>

      <form
        onSubmit={submit}
        className="cromo bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base w-full"
            placeholder="Tu nombre"
            required
            autoFocus
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
            PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input-base w-full font-mono tracking-[0.5em] text-center text-2xl"
            placeholder="••••"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
            ⚠️ {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Entrando..." : "Entrar →"}
        </button>
      </form>
    </div>
  );
}
