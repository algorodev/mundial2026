import Link from "next/link";
import { peekMagicLink } from "@/lib/auth";
import MagicLoginClient from "./MagicLoginClient";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

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
  const locale = await getLocale();
  const t = getDictionary(locale);

  if (!token) {
    return <ErrorBlock title={t.auth.magicLogin.missingToken} requestNewLink={t.auth.magicLogin.requestNewLink} />;
  }

  const link = await peekMagicLink(token);

  if (!link || link.purpose !== "login") {
    return (
      <ErrorBlock
        title={t.auth.magicLogin.invalidLink}
        hint={t.auth.magicLogin.invalidLinkHint}
        requestNewLink={t.auth.magicLogin.requestNewLink}
      />
    );
  }

  return <MagicLoginClient token={token} email={link.email} />;
}

function ErrorBlock({ title, hint, requestNewLink }: { title: string; hint?: string; requestNewLink: string }) {
  return (
    <div className="pt-12 sm:pt-20 max-w-md mx-auto text-center">
      <h1 className="font-display text-4xl sm:text-5xl text-pitch-900 dark:text-chalk-50 leading-none mb-4">
        {title}
      </h1>
      {hint && <p className="text-pitch-500 dark:text-chalk-300 mb-6">{hint}</p>}
      <Link href="/login" className="btn-primary">
        {requestNewLink}
      </Link>
    </div>
  );
}
