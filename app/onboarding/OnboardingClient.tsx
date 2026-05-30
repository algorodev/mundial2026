"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingClient({
  next,
}: {
  next: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password: showPassword ? password : "" }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "No se pudo guardar el perfil");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
          BIENVENIDO
        </h1>
        <p className="mt-4 text-chalk-300">
          Solo necesitamos tu nombre para empezar.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="cromo bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
            Tu nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base w-full"
            placeholder="Como quieres que te vean en el ranking"
            maxLength={60}
            required
            autoFocus
            autoComplete="name"
          />
        </div>

        {!showPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(true)}
            className="text-xs text-chalk-400 hover:text-flame-400 underline underline-offset-2 transition-colors"
          >
            Añadir contraseña para entrar sin magic link →
          </button>
        ) : (
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
              Contraseña <span className="text-chalk-500 normal-case font-sans font-normal">(opcional)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base w-full"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => { setShowPassword(false); setPassword(""); }}
              className="mt-2 text-xs text-chalk-500 hover:text-chalk-300 underline underline-offset-2 transition-colors"
            >
              Cancelar, no quiero contraseña
            </button>
          </div>
        )}

        {error && (
          <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="btn-primary w-full"
        >
          {loading ? "Guardando..." : "Entrar →"}
        </button>
      </form>
    </div>
  );
}
