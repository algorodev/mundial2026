import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { magicLinks } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// Página intermedia para el flujo de magic link. El email manda al usuario
// AQUÍ (no al endpoint de la API directamente) para que los prefetchers de
// los clientes de email — Outlook Safe Links, antivirus corporativos,
// crawlers de previsualización — no consuman el token. Esos solo hacen GET.
//
// El token se consume cuando el usuario pulsa el botón, que dispara un POST
// a /api/auth/verify.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return <ErrorBlock title="Falta el token" />;
  }

  // Lookup sin tocar nada — los prefetchers pueden ejecutar este SELECT y
  // no rompemos el flujo del usuario.
  const [link] = await db
    .select({
      consumedAt: magicLinks.consumedAt,
      expiresAt: magicLinks.expiresAt,
    })
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .limit(1);

  if (!link) {
    return <ErrorBlock title="Enlace no válido" />;
  }
  if (link.consumedAt) {
    return (
      <ErrorBlock
        title="Ya has usado este enlace"
        hint="Pide uno nuevo desde la página de entrada."
      />
    );
  }
  if (link.expiresAt < new Date()) {
    return (
      <ErrorBlock
        title="El enlace ha caducado"
        hint="Pide uno nuevo desde la página de entrada (caducan a los 15 minutos)."
      />
    );
  }

  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
          ENTRAR
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-[11px] px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Confirma tu acceso
        </p>
      </div>
      <form
        method="POST"
        action="/api/auth/verify"
        className="cromo bg-pitch-900 p-6 sm:p-8 space-y-5"
      >
        <input type="hidden" name="token" value={token} />
        <p className="text-chalk-200 text-sm leading-relaxed">
          Pulsa el botón para entrar a tu cuenta. Este paso evita que clientes
          de correo y filtros antivirus consuman tu enlace por accidente.
        </p>
        <button type="submit" className="btn-primary w-full">
          Entrar a PorraBros →
        </button>
      </form>
    </div>
  );
}

function ErrorBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto text-center">
      <h1 className="font-display text-4xl sm:text-5xl text-chalk-50 leading-none mb-4">
        {title}
      </h1>
      {hint && <p className="text-chalk-300 mb-6">{hint}</p>}
      <Link href="/login" className="btn-primary">
        Pedir un enlace nuevo
      </Link>
    </div>
  );
}
