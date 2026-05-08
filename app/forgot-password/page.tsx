"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ForgotPasswordInner() {
  const params = useSearchParams();
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
        setError(data.error || "No se pudo enviar el correo");
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
            Si <strong>{email}</strong> está registrado en PorraBros, te hemos
            enviado un enlace para crear una contraseña nueva. Caduca en 15
            minutos.
          </p>
        </div>
        <Link href={`/login${nextQuery}`} className="btn-secondary w-full block text-center">
          Volver a entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
          RECUPERAR ACCESO
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Te mandamos un enlace
        </p>
      </div>

      <form
        onSubmit={submit}
        className="cromo bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
        <p className="text-chalk-200 text-sm leading-relaxed">
          Pon tu email y te enviamos un enlace para crear una contraseña
          nueva.
        </p>

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

        <p className="text-xs text-chalk-400 text-center">
          <Link
            href={`/login${nextQuery}`}
            className="hover:text-flame-400 underline underline-offset-2"
          >
            Volver a entrar
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
