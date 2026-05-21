import Link from "next/link";
import { peekMagicLink } from "@/lib/auth";
import MagicLoginClient from "./MagicLoginClient";

export const dynamic = "force-dynamic";

// Página intermedia para el flujo "magic-link login". El email manda al
// usuario aquí (no al endpoint de la API directamente) para que los
// prefetchers — Outlook Safe Links, antivirus corporativos, crawlers de
// previsualización — no consuman el token. Esos solo hacen GET.
//
// El token se consume cuando el usuario pulsa "Entrar" (POST).
export default async function MagicLoginPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return <ErrorBlock title="Falta el token" />;
  }

  const link = await peekMagicLink(token);

  if (!link || link.purpose !== "login") {
    return (
      <ErrorBlock
        title="Enlace no válido"
        hint="Puede haber caducado o ya haberse usado. Pide otro desde la pantalla de entrada."
      />
    );
  }

  return <MagicLoginClient token={token} email={link.email} />;
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
