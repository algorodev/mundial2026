import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  kicker: string;
  title: ReactNode;
  updated: string;
  children: ReactNode;
};

export default function LegalLayout({ kicker, title, updated, children }: Props) {
  return (
    <div className="pt-12 sm:pt-16 max-w-3xl mx-auto">
      <header className="text-center mb-10">
        <span className="inline-block bg-flame-500 text-pitch-950 font-display text-xs px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {kicker}
        </span>
        <h1 className="mt-6 font-display text-4xl sm:text-5xl text-chalk-50 leading-none">
          {title}
        </h1>
        <p className="mt-4 font-mono text-[11px] text-chalk-400 uppercase tracking-widest">
          Última actualización: {updated}
        </p>
      </header>

      <article className="cromo bg-pitch-900 p-6 sm:p-8 prose-legal text-chalk-200 leading-relaxed">
        {children}
      </article>

      <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        <Link
          href="/privacidad"
          className="text-chalk-300 hover:text-flame-400 underline underline-offset-4"
        >
          Privacidad
        </Link>
        <span aria-hidden="true" className="text-chalk-400">·</span>
        <Link
          href="/terminos"
          className="text-chalk-300 hover:text-flame-400 underline underline-offset-4"
        >
          Términos
        </Link>
        <span aria-hidden="true" className="text-chalk-400">·</span>
        <Link
          href="/cookies"
          className="text-chalk-300 hover:text-flame-400 underline underline-offset-4"
        >
          Cookies
        </Link>
        <span aria-hidden="true" className="text-chalk-400">·</span>
        <Link
          href="/about"
          className="text-chalk-300 hover:text-flame-400 underline underline-offset-4"
        >
          Sobre nosotros
        </Link>
      </nav>

      <div className="h-20" />
    </div>
  );
}
