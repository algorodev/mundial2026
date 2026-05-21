"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
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
      setError("El enlace ya no es válido. Vuelve a intentarlo.");
    } else if (errorParam === "missing") {
      setError("El enlace no es válido.");
    }
  }, [errorParam]);

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
        setError(data.error || "No se pudo iniciar sesión");
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
      setError("Escribe tu email para recibir el enlace.");
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
        setError(data.error || "No se pudo enviar el enlace");
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
          <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
            REVISA TU CORREO
          </h1>
          <p className="mt-5 text-chalk-300">
            {isMagic ? (
              <>
                Si tu email <strong>{email}</strong> está registrado, te hemos
                enviado un enlace para entrar sin contraseña. Caduca en 15
                minutos.
              </>
            ) : (
              <>
                Tu cuenta ya existía pero aún no tiene contraseña. Te hemos
                enviado un enlace a <strong>{email}</strong> para que la crees.
                Caduca en 15 minutos.
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
          Volver
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
          Sin fricciones
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

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={magicLoading || loading}
          className="btn-primary w-full"
        >
          {magicLoading ? "Enviando..." : "Enviar enlace por email →"}
        </button>

        <div className="flex items-center gap-3 text-[10px] text-chalk-500 uppercase tracking-widest font-mono">
          <div className="flex-1 h-px bg-pitch-700" />
          <span>o usa contraseña</span>
          <div className="flex-1 h-px bg-pitch-700" />
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
            placeholder="••••••••"
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
          className="btn-secondary w-full"
        >
          {loading ? "Entrando..." : "Entrar con contraseña →"}
        </button>

        <div className="flex items-center justify-between text-xs text-chalk-400">
          <Link
            href={`/forgot-password${nextQuery}`}
            className="hover:text-flame-400 underline underline-offset-2"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <Link
            href={`/register${nextQuery}`}
            className="hover:text-flame-400 underline underline-offset-2"
          >
            Crear cuenta
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
