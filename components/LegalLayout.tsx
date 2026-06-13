import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

type Props = {
  kicker: string;
  title: ReactNode;
  updated: string;
  children: ReactNode;
};

export default async function LegalLayout({ kicker, title, updated, children }: Props) {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="pt-12 sm:pt-16 max-w-3xl mx-auto">
      <header className="text-center mb-10">
        <span className="inline-block bg-flame-500 text-pitch-950 font-display text-xs px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {kicker}
        </span>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl text-pitch-900 dark:text-chalk-50 leading-none">
          {title}
        </h1>
        <p className="mt-4 font-mono text-[11px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
          Última actualización: {updated}
        </p>
      </header>

      <article className="cromo bg-paper-50 dark:bg-pitch-900 p-6 sm:p-8 prose-legal text-pitch-800 dark:text-chalk-200 leading-relaxed">
        {children}
      </article>

      <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        <Link
          href="/privacidad"
          className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
        >
          {t.footer.privacy}
        </Link>
        <span aria-hidden="true" className="text-pitch-500 dark:text-chalk-400">·</span>
        <Link
          href="/terminos"
          className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
        >
          {t.footer.terms}
        </Link>
        <span aria-hidden="true" className="text-pitch-500 dark:text-chalk-400">·</span>
        <Link
          href="/cookies"
          className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
        >
          {t.footer.cookies}
        </Link>
        <span aria-hidden="true" className="text-pitch-500 dark:text-chalk-400">·</span>
        <Link
          href="/about"
          className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
        >
          {t.footer.about}
        </Link>
      </nav>

      <div className="h-20" />
    </div>
  );
}
