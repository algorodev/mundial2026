"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginInner() {
  const params = useSearchParams();
  const redirectTo = params.get("next");
  const errorParam = params.get("error");

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (errorParam === "invalid") {
      setError("El enlace ya no es válido. Pide otro y úsalo en 15 minutos.");
    } else if (errorParam === "missing") {
      setError("El enlace no es válido. Pide uno nuevo.");
    }
  }, [errorParam]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo: redirectTo || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error enviando el correo");
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
          <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
            REVISA TU CORREO
          </h1>
          <p className="mt-5 text-chalk-300">
            Te hemos enviado un enlace a <strong>{email}</strong>. Caduca en 15 minutos.
          </p>
        </div>
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="btn-secondary w-full"
        >
          Usar otro email
        </button>
      </div>
    );
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-6xl sm:text-7xl text-chalk-50 leading-none">
          ENTRAR
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Te enviamos un enlace mágico a tu correo
        </p>
      </div>

      <form
        onSubmit={submit}
        className="cromo bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
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
          {loading ? "Enviando..." : "Enviarme el enlace →"}
        </button>
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
