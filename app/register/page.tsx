"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PASSWORD_MIN = 8;

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
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
        setError(data.error || "No se pudo crear la cuenta");
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
        <h1 className="font-display text-6xl sm:text-7xl text-chalk-50 leading-none">
          CREAR CUENTA
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Tres campos y dentro
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
            placeholder="El que verán tus colegas en el ranking"
            required
            maxLength={60}
            autoFocus
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base w-full"
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base w-full"
            placeholder="Mínimo 8 caracteres"
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

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creando cuenta..." : "Crear cuenta →"}
        </button>

        <p className="text-xs text-chalk-400 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={`/login${nextQuery}`}
            className="hover:text-flame-400 underline underline-offset-2"
          >
            Entrar
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
