import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments, groups } from "@/lib/db/schema";
import TournamentBadge from "@/components/TournamentBadge";
import type { LandingConfig } from "@/lib/landings";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

const DATE_FMT = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

function formatDate(d: Date) {
  return DATE_FMT.format(d).replace(/\./g, "");
}

export default async function TournamentLanding({
  cfg,
}: {
  cfg: LandingConfig;
}) {
  // Cargamos el torneo y los primeros partidos de la DB. Si el torneo aún
  // no existe (p.ej. LaLiga sin seedear), seguimos rindiendo la landing
  // con los datos hardcodeados — la SEO sigue siendo válida.
  const [tournament] = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      slug: tournaments.slug,
      status: tournaments.status,
      officialGroupId: tournaments.officialGroupId,
    })
    .from(tournaments)
    .where(eq(tournaments.slug, cfg.tournamentSlug))
    .limit(1);

  const [officialGroup] = tournament?.officialGroupId
    ? await db
        .select({ slug: groups.slug, visibility: groups.visibility })
        .from(groups)
        .where(eq(groups.id, tournament.officialGroupId))
        .limit(1)
    : [];
  const officialSlug =
    officialGroup && officialGroup.visibility === "public"
      ? officialGroup.slug
      : null;

  const upcomingMatches = tournament
    ? await db
        .select({
          id: matches.id,
          kickoffAt: matches.kickoffAt,
          homeTeam: matches.homeTeam,
          awayTeam: matches.awayTeam,
          homeFlag: matches.homeFlag,
          awayFlag: matches.awayFlag,
          stadium: matches.stadium,
          groupName: matches.groupName,
        })
        .from(matches)
        .where(eq(matches.tournamentId, tournament.id))
        .orderBy(asc(matches.kickoffAt))
        .limit(8)
    : [];

  const preselectHref = `/groups/new?preselect=${encodeURIComponent(cfg.tournamentSlug)}`;
  const calendarHref = `/api/calendar/${cfg.tournamentSlug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: cfg.h1,
    description: cfg.seoDescription,
    sport: "Football",
    url: `${APP_URL}/porra-${cfg.tournamentSlug}`,
  };

  return (
    <div className="pt-10 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* HERO */}
      <section className="text-center max-w-3xl mx-auto">
        {tournament && (
          <TournamentBadge
            slug={tournament.slug}
            name={tournament.name}
            size="xl"
            onDark
            className="mx-auto mb-6"
          />
        )}
        <h1 className="font-display text-5xl sm:text-7xl text-chalk-50 leading-none">
          {cfg.h1}
        </h1>
        <p className="mt-5 inline-block bg-flame-500 text-pitch-950 font-display text-xs sm:text-sm px-4 py-2 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest -rotate-1">
          {cfg.tagline}
        </p>

        <p className="mt-8 text-chalk-200 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {cfg.intro}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href={preselectHref} className="btn-primary">
            Crea tu porra gratis →
          </Link>
          <a
            href={calendarHref}
            className="btn-secondary"
            download
          >
            ⬇ {cfg.calendarLabel}
          </a>
        </div>
      </section>

      {officialSlug && (
        <section className="mt-16 max-w-3xl mx-auto">
          <div className="cromo bg-flame-500 text-pitch-950 p-6 sm:p-7 text-center -rotate-1">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">
              🏆 Sin amigos a mano, juega solo
            </div>
            <h2 className="font-display text-3xl sm:text-4xl mt-2 uppercase leading-none">
              Porra oficial pública
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Únete a la porra abierta del torneo. Leaderboard en directo,
              visible para todos.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/g/${officialSlug}/leaderboard`}
                className="btn-secondary"
              >
                Ver leaderboard →
              </Link>
              <Link
                href={`/g/${officialSlug}/leaderboard`}
                className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:opacity-70"
              >
                (público, sin login)
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FORMATO */}
      <section className="mt-24 sm:mt-32 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal rotate-1">
            🏆 FORMATO
          </span>
        </div>
        <ul className="space-y-3">
          {cfg.formatBullets.map((b, i) => (
            <li
              key={i}
              className="cromo bg-paper-50 text-pitch-950 px-5 py-3 flex items-start gap-3"
            >
              <span className="font-display text-flame-600 text-2xl leading-none shrink-0">
                ▸
              </span>
              <span className="leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* PRÓXIMOS PARTIDOS */}
      {upcomingMatches.length > 0 && (
        <section className="mt-24 sm:mt-32 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal -rotate-1">
              📅 PRIMEROS PARTIDOS
            </span>
          </div>
          <div className="cromo bg-paper-50 text-pitch-950 p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <tbody>
                {upcomingMatches.map((m) => (
                  <tr key={m.id} className="border-b border-pitch-200 last:border-0">
                    <td className="py-2 pr-3 font-mono text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap text-pitch-700">
                      {formatDate(m.kickoffAt)}
                    </td>
                    <td className="py-2 px-2 font-display uppercase tracking-tight">
                      {m.homeFlag} {m.homeTeam}
                    </td>
                    <td className="py-2 px-2 text-center text-pitch-500 font-mono text-xs">
                      vs
                    </td>
                    <td className="py-2 px-2 font-display uppercase tracking-tight text-right">
                      {m.awayTeam} {m.awayFlag}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
            {tournament ? `Y ${tournament ? "muchos más" : ""}…` : ""} Descarga el calendario completo para añadirlo a tu móvil.
          </p>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="mt-24 sm:mt-32 max-w-3xl mx-auto text-center">
        <h2 className="font-display text-4xl sm:text-5xl text-chalk-50 leading-none mb-5 uppercase">
          ¿Listo?
        </h2>
        <p className="text-chalk-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8">
          Crear tu porra es gratis y tarda 30 segundos. Invitas por WhatsApp,
          tus amigos se unen con un toque y el ranking se actualiza solo.
        </p>
        <Link href={preselectHref} className="btn-primary inline-block">
          Crear porra ahora →
        </Link>
        <p className="mt-3 font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
          Sin tarjeta · sin instalar · sin Excel
        </p>
      </section>

      <div className="h-24" />
    </div>
  );
}
