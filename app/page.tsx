import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import TournamentBadge from "@/components/TournamentBadge";
import MundialHero from "@/components/MundialHero";
import HomeShowcase from "@/components/HomeShowcase";
import HomeCompare from "@/components/HomeCompare";
import { getTournamentStart } from "@/lib/tournament";
import { LANDINGS } from "@/lib/landings";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

const FEATURED_SLUG = "mundial-2026";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-brick-500 text-paper-50",
  upcoming: "bg-flame-500 text-pitch-950",
  live: "bg-grass-500 text-paper-50",
  finished: "bg-paper-200 text-pitch-700",
};

// Schema.org structured data — ayuda a Google a entender qué es la app.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "PorraBros",
      url: APP_URL,
      logo: `${APP_URL}/brand/porrabros-logo-principal-1200.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "PorraBros",
      description:
        "Plataforma de porras de deportes entre amigos. Mundial 2026, Champions League, LaLiga.",
      inLanguage: "es-ES",
      publisher: { "@id": `${APP_URL}/#organization` },
    },
    {
      "@type": "WebApplication",
      name: "PorraBros",
      url: APP_URL,
      applicationCategory: "SportsApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
  ],
};

export default async function HomePage() {
  const session = await getSession();
  const locale = await getLocale();
  const t = getDictionary(locale);

  const STATUS_LABEL: Record<string, string> = {
    draft: t.home.statusDraft,
    upcoming: t.home.statusUpcoming,
    live: t.home.statusLive,
    finished: t.home.statusFinished,
  };

  const tournamentList = await db
    .select({
      id: tournaments.id,
      slug: tournaments.slug,
      name: tournaments.name,
      status: tournaments.status,
    })
    .from(tournaments)
    .orderBy(asc(tournaments.createdAt));

  const featured = tournamentList.find(
    (tourn) =>
      tourn.slug === FEATURED_SLUG &&
      (tourn.status === "upcoming" || tourn.status === "live")
  );
  const featuredStart = featured
    ? await getTournamentStart(featured.id)
    : null;

  return (
    <div className="pt-10 sm:pt-16 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <section className="relative">
        <div className="band bg-brick-500" style={{ top: "30%" }} />
        <div
          className="band bg-flame-500"
          style={{ top: "55%", transform: "rotate(2deg)" }}
        />

        <div className="text-center max-w-4xl mx-auto relative">
          <Image
            src="/brand/porrabros-logo-principal.svg"
            alt="PorraBros"
            width={1200}
            height={1200}
            priority
            unoptimized
            className="mx-auto w-[260px] sm:w-[420px] h-auto drop-shadow-2xl"
            style={{ height: "auto" }}
          />

          <p className="mt-10 text-pitch-700 dark:text-chalk-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {t.home.heroDescription}
          </p>

          {!featured && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {session ? (
                <Link href="/groups" className="btn-primary">
                  {t.home.myPools}
                </Link>
              ) : (
                <Link href="/login" className="btn-primary">
                  {t.home.start}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {featured && featuredStart && (
        <MundialHero
          tournamentSlug={featured.slug}
          tournamentName={featured.name}
          kickoffIso={featuredStart.iso}
          kickoffLabel={featuredStart.label}
          status={featured.status as "upcoming" | "live"}
        />
      )}

      {/* Próximos torneos (upcoming / live / draft) */}
      {tournamentList.some((tourn) => tourn.status !== "finished") && (
        <section className="mt-24 sm:mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal rotate-1">
              {t.home.tournamentsSection}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {tournamentList
              .filter((tourn) => tourn.status !== "finished")
              .map((tourn, idx) => {
                const tilt =
                  idx % 3 === 0
                    ? "-rotate-1"
                    : idx % 3 === 1
                      ? "rotate-1"
                      : "rotate-[-0.5deg]";
                const inscribable =
                  tourn.status === "upcoming" || tourn.status === "live";
                const hasLanding = !!LANDINGS[tourn.slug];
                const landingHref = hasLanding
                  ? `/porra-${tourn.slug}`
                  : `/groups/new?preselect=${encodeURIComponent(tourn.slug)}`;
                const isLinkable = inscribable && hasLanding;
                const cardClass = `cromo bg-paper-50 text-pitch-950 ${tilt} p-5 sm:p-6 hover:rotate-0 hover:-translate-y-1 transition-all flex flex-col items-center text-center`;
                const content = (
                  <>
                    <TournamentBadge
                      slug={tourn.slug}
                      name={tourn.name}
                      size="xl"
                      className="mb-4"
                    />
                    <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight leading-tight">
                      {tourn.name}
                    </h3>
                    <span
                      className={`mt-3 inline-block font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 border-2 border-pitch-950 ${
                        STATUS_STYLES[tourn.status] ?? "bg-paper-200 text-pitch-700"
                      }`}
                    >
                      {STATUS_LABEL[tourn.status] ?? tourn.status}
                    </span>
                    {inscribable && (
                      <span className="mt-3 font-display text-sm uppercase tracking-widest text-flame-600">
                        {hasLanding ? t.home.seeTournament : t.home.createPool}
                      </span>
                    )}
                  </>
                );
                return isLinkable ? (
                  <Link key={tourn.slug} href={landingHref} className={cardClass}>
                    {content}
                  </Link>
                ) : (
                  <article key={tourn.slug} className={cardClass}>
                    {content}
                  </article>
                );
              })}
          </div>

          <p className="mt-10 text-center font-mono text-[11px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
            {t.home.tournamentsCta}
          </p>
        </section>
      )}

      <HomeShowcase />

      {/* Torneos pasados (finished) */}
      {tournamentList.some((tourn) => tourn.status === "finished") && (
        <section className="mt-24 sm:mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-paper-50 dark:bg-pitch-800 text-pitch-700 dark:text-chalk-300 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-paper-200 dark:border-pitch-700 shadow-brutal -rotate-1">
              {t.home.pastEditions}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {tournamentList
              .filter((tourn) => tourn.status === "finished")
              .map((tourn, idx) => {
                const tilt =
                  idx % 3 === 0
                    ? "-rotate-1"
                    : idx % 3 === 1
                      ? "rotate-1"
                      : "rotate-[-0.5deg]";
                const hasLanding = !!LANDINGS[tourn.slug];
                const landingHref = `/porra-${tourn.slug}`;
                const cardClass = `cromo bg-paper-100 text-pitch-800 ${tilt} p-5 sm:p-6 hover:rotate-0 hover:-translate-y-1 transition-all flex flex-col items-center text-center opacity-80 hover:opacity-100`;
                const content = (
                  <>
                    <TournamentBadge
                      slug={tourn.slug}
                      name={tourn.name}
                      size="xl"
                      className="mb-4 grayscale"
                    />
                    <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight leading-tight">
                      {tourn.name}
                    </h3>
                    <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 border-2 border-pitch-400 bg-paper-200 text-pitch-600">
                      {t.home.finished}
                    </span>
                    {hasLanding && (
                      <span className="mt-3 font-display text-sm uppercase tracking-widest text-chalk-500">
                        {t.home.seeResults}
                      </span>
                    )}
                  </>
                );
                return hasLanding ? (
                  <Link key={tourn.slug} href={landingHref} className={cardClass}>
                    {content}
                  </Link>
                ) : (
                  <article key={tourn.slug} className={cardClass}>
                    {content}
                  </article>
                );
              })}
          </div>
        </section>
      )}

      <section className="mt-24 sm:mt-32 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal -rotate-1">
            {t.home.rulesSection}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <RuleCromo
            num="3"
            title={t.home.ruleExactTitle}
            desc={t.home.ruleExactDesc}
            color="grass"
            rotate="-rotate-2"
          />
          <RuleCromo
            num="1"
            title={t.home.ruleSignTitle}
            desc={t.home.ruleSignDesc}
            color="mustard"
            rotate="rotate-1"
          />
          <RuleCromo
            num="0"
            title={t.home.ruleMissTitle}
            desc={t.home.ruleMissDesc}
            color="brick"
            rotate="-rotate-1"
          />
        </div>

        <p className="mt-12 text-center font-mono text-sm text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
          {t.home.rulesClosed}
        </p>
      </section>

      <HomeCompare />

      <section className="mt-24 max-w-3xl mx-auto text-center">
        <p className="font-mono text-[11px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest mb-3">
          {t.home.moreAbout}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/porra-mundial-2026"
            className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
          >
            Porra Mundial 2026
          </Link>
          <Link
            href="/porra-champions-2025-26"
            className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
          >
            Porra Champions 2025-26
          </Link>
          <Link
            href="/porra-laliga-2026-27"
            className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
          >
            Porra LaLiga 2026-27
          </Link>
          <Link
            href="/porra-premier-league-2026-27"
            className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
          >
            Porra Premier League 2026-27
          </Link>
          <Link
            href="/porra-nba-2026-27"
            className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
          >
            Porra NBA 2026-27
          </Link>
          <Link
            href="/porra-liga-endesa-2026-27"
            className="text-pitch-700 dark:text-chalk-300 hover:text-flame-400 underline underline-offset-4"
          >
            Porra Liga Endesa 2026-27
          </Link>
        </div>
      </section>

      <div className="h-24" />
    </div>
  );
}

function RuleCromo({
  num,
  title,
  desc,
  color,
  rotate,
}: {
  num: string;
  title: string;
  desc: string;
  color: "grass" | "mustard" | "brick";
  rotate: string;
}) {
  const numStyles = {
    grass: "bg-grass-500 text-paper-50",
    mustard: "bg-flame-500 text-pitch-950",
    brick: "bg-brick-500 text-paper-50",
  };
  return (
    <article
      className={`cromo bg-paper-50 text-pitch-950 ${rotate} p-5 hover:rotate-0 hover:-translate-y-1 transition-all`}
    >
      <div
        className={`${numStyles[color]} w-24 h-24 flex items-center justify-center font-display text-7xl border-2 border-pitch-950 shadow-brutal-sm mb-5`}
      >
        {num}
      </div>
      <div className="font-display text-3xl">{title}</div>
      <div className="text-sm mt-2 opacity-70 leading-relaxed">{desc}</div>
    </article>
  );
}
