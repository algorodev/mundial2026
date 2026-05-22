import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

const TITLE = "Sobre nosotros · PorraBros";
const DESCRIPTION =
  "Somos PorraBros: un grupo de chavales de Valencia que querían hacer la porra del Mundial 2026 sin hojas de cálculo. Acabó siendo una plataforma para porras de cualquier torneo.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/about",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${APP_URL}/about`,
  name: TITLE,
  description: DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: "PorraBros",
    url: APP_URL,
  },
};

export default function AboutPage() {
  return (
    <div className="pt-12 sm:pt-20 max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />

      <header className="text-center mb-12">
        <span className="inline-block bg-flame-500 text-pitch-950 font-display text-xs px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          Quiénes somos
        </span>
        <h1 className="mt-6 font-display text-5xl sm:text-6xl text-chalk-50 leading-none">
          UN PUÑADO DE CHAVALES
          <br />
          <span className="text-flame-400">DE VALENCIA</span>
        </h1>
        <p className="mt-6 text-chalk-300 text-lg leading-relaxed">
          Y una idea muy simple: que hacer la porra con la pandilla sea tan
          fácil como mandar un enlace por WhatsApp.
        </p>
      </header>

      <section className="cromo bg-pitch-900 p-6 sm:p-8 space-y-5 text-chalk-200 leading-relaxed">
        <p>
          PorraBros nació en una sobremesa de Valencia, hablando de cómo
          íbamos a montar la <strong className="text-flame-400">porra del
          Mundial 2026</strong>. La opción habitual era la de siempre: un
          Excel compartido, un grupo de WhatsApp con cien mensajes de
          pronósticos perdidos por arriba, y alguien con paciencia infinita
          haciendo de árbitro al final de cada jornada.
        </p>
        <p>
          Nos dio pereza. Y entonces nos dio curiosidad. ¿Y si lo hacíamos
          bien? ¿Y si en vez de pelearnos con celdas hacíamos algo que
          cualquiera pudiera abrir en el móvil, meter sus pronósticos en diez
          segundos y ver el ranking en directo?
        </p>
        <p>
          Eso es PorraBros. Una herramienta hecha por gente a la que le gusta
          el fútbol, las apuestas con amigos (sin dinero) y discutir durante
          horas si Croacia llega a cuartos.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Pillar
          emoji="🤝"
          title="Entre amigos"
          desc="Sin apuestas reales, sin dinero. Solo el orgullo de ganarle a tu cuñado."
          rotate="-rotate-1"
        />
        <Pillar
          emoji="⚡"
          title="Rápido y simple"
          desc="Creas el grupo, mandas un link, listo. Sin instalar nada, sin tutoriales."
          rotate="rotate-1"
        />
        <Pillar
          emoji="🏆"
          title="Multi-torneo"
          desc="Empezamos por el Mundial 2026, pero hay Champions, LaLiga y lo que venga."
          rotate="-rotate-0.5"
        />
      </section>

      <section className="mt-14 cromo bg-paper-50 text-pitch-950 p-6 sm:p-8">
        <h2 className="font-display text-3xl sm:text-4xl uppercase leading-tight">
          ¿De dónde venimos?
        </h2>
        <p className="mt-4 text-pitch-800 leading-relaxed">
          De Valencia, ya lo dijimos. Más concretamente, de un grupo de
          colegas que llevan media vida montando porras de todo: la
          Eurocopa, las Champions, el Tour, hasta de Eurovisión. Cada vez
          que llega un torneo grande surge la misma conversación, y en 2026
          decidimos que tocaba dejar de improvisar y montarlo en condiciones.
        </p>
        <p className="mt-4 text-pitch-800 leading-relaxed">
          El proyecto está hecho con cariño, en ratos libres, sin inversores
          ni planes raros. Si funciona y le gusta a la gente, seguimos. Si
          no, al menos nosotros tendremos nuestra porra del Mundial bien
          montada.
        </p>
      </section>

      <section className="mt-14 text-center">
        <p className="font-mono text-[11px] text-chalk-400 uppercase tracking-widest mb-5">
          ¿Nos echas una mano?
        </p>
        <p className="text-chalk-200 max-w-xl mx-auto leading-relaxed">
          La mejor manera de ayudarnos es montar tu porra con tu pandilla y
          contarnos qué falla. Cualquier sugerencia, bug o idea, escríbenos
          a{" "}
          <a
            href="mailto:admin@porrabros.com"
            className="text-flame-400 hover:text-flame-300 underline underline-offset-4"
          >
            admin@porrabros.com
          </a>
          .
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="btn-primary">
            Crear mi porra →
          </Link>
          <Link href="/" className="btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </section>

      <div className="mt-16 text-center">
        <Image
          src="/brand/porrabros-logo-principal.svg"
          alt="PorraBros"
          width={1200}
          height={1200}
          unoptimized
          className="mx-auto w-[140px] sm:w-[180px] h-auto opacity-70"
          style={{ height: "auto" }}
        />
      </div>

      <div className="h-24" />
    </div>
  );
}

function Pillar({
  emoji,
  title,
  desc,
  rotate,
}: {
  emoji: string;
  title: string;
  desc: string;
  rotate: string;
}) {
  return (
    <article
      className={`cromo bg-paper-50 text-pitch-950 ${rotate} p-5 hover:rotate-0 hover:-translate-y-1 transition-all`}
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-display text-xl uppercase leading-tight">{title}</h3>
      <p className="mt-2 text-sm text-pitch-800 leading-relaxed">{desc}</p>
    </article>
  );
}
