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
    <div className="pt-16 max-w-md mx-auto">
      <h1 className="font-display text-5xl text-chalk-50 text-center mb-2">
        Entrar
      </h1>
      <p className="text-center text-chalk-400 text-sm mb-10 font-mono uppercase tracking-widest">
        Pide tu nombre y PIN al organizador
      </p>

      <form
        onSubmit={submit}
        className="bg-pitch-900/60 border border-pitch-800 rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-chalk-400 mb-2">
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
          <label className="block text-xs font-mono uppercase tracking-widest text-chalk-400 mb-2">
            PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input-base w-full font-mono tracking-[0.3em]"
            placeholder="••••"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-200 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
