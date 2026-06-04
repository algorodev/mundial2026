import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments, groups, users, predictions, groupMembers } from "@/lib/db/schema";
import TournamentBadge from "@/components/TournamentBadge";
import StandingsView, { type StandingRow } from "@/components/StandingsView";
import { getStandings } from "@/lib/api-football";
import { calcPoints } from "@/lib/scoring";
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
      apiLeagueId: tournaments.apiLeagueId,
      apiSeason: tournaments.apiSeason,
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
  const landingUrl = `${APP_URL}/porra-${cfg.tournamentSlug}`;

  // Clasificación oficial del torneo (si está integrado con API-Football y hay
  // datos publicados). Cache server-side de 1 hora — esto es marketing, no
  // necesita frescura de segundos y mucha gente sin sesión puede pegarle.
  // Si la API se cae o el torneo aún no ha empezado, ocultamos la sección.
  let standingsGroups: StandingRow[][] = [];
  if (tournament?.apiLeagueId && tournament?.apiSeason) {
    try {
      const data = await getStandings(
        tournament.apiLeagueId,
        tournament.apiSeason,
        { revalidate: 3600 }
      );
      standingsGroups = data[0]?.league.standings ?? [];
    } catch {
      // silencio: si la API falla, simplemente no mostramos la sección
    }
  }

  // Ganador de la porra oficial cuando el torneo ha terminado
  type WinnerRow = { name: string | null; total: number; exact: number };
  let winners: WinnerRow[] = [];
  if (tournament?.status === "finished" && tournament.officialGroupId) {
    const officialGroupId = tournament.officialGroupId;
    const memberRows = await db
      .select({ userId: groupMembers.userId, name: users.name })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, officialGroupId));

    if (memberRows.length > 0) {
      const [allMatchesList, allPreds] = await Promise.all([
        db.select().from(matches).where(eq(matches.tournamentId, tournament.id)),
        db.select().from(predictions).where(eq(predictions.groupId, officialGroupId)),
      ]);
      const matchById = new Map(allMatchesList.map((m) => [m.id, m]));
      const statsMap = new Map<number, WinnerRow>();
      for (const m of memberRows) {
        statsMap.set(m.userId, { name: m.name, total: 0, exact: 0 });
      }
      for (const p of allPreds) {
        const s = statsMap.get(p.userId);
        if (!s) continue;
        const m = matchById.get(p.matchId);
        if (!m || m.homeScore == null || m.awayScore == null) continue;
        const { points, result } = calcPoints(p.homeScore, p.awayScore, m.homeScore, m.awayScore);
        s.total += points;
        if (result === "exact") s.exact += 1;
      }
      const sorted = Array.from(statsMap.values()).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        if (b.exact !== a.exact) return b.exact - a.exact;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });
      if (sorted.length > 0) {
        const { total, exact } = sorted[0];
        winners = sorted.filter((p) => p.total === total && p.exact === exact);
      }
    }
  }

  // startDate / endDate del torneo se sacan del primer y último partido
  // (ya tenemos upcomingMatches por kickoff asc). Para el endDate hacemos
  // otra query si encontramos torneo.
  let startDateIso: string | null = null;
  let endDateIso: string | null = null;
  if (tournament && upcomingMatches.length > 0) {
    startDateIso = upcomingMatches[0].kickoffAt.toISOString();
    const [last] = await db
      .select({ kickoffAt: matches.kickoffAt })
      .from(matches)
      .where(eq(matches.tournamentId, tournament.id))
      .orderBy(desc(matches.kickoffAt))
      .limit(1);
    if (last) endDateIso = last.kickoffAt.toISOString();
  }

  const sportsEvent = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: tournament?.name ?? cfg.h1,
    description: cfg.seoDescription,
    sport: cfg.sport ?? "Fútbol",
    url: landingUrl,
    image: `${APP_URL}/tournaments/${cfg.tournamentSlug}.png`,
    ...(startDateIso && { startDate: startDateIso }),
    ...(endDateIso && { endDate: endDateIso }),
    organizer: {
      "@type": "Organization",
      name: "PorraBros",
      url: APP_URL,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "PorraBros",
        item: `${APP_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cfg.h1,
        item: landingUrl,
      },
    ],
  };

  return (
    <div className="pt-10 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEvent) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
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
          {tournament?.status !== "finished" && (
            <Link href={preselectHref} className="btn-primary">
              Crea tu porra gratis →
            </Link>
          )}
          {tournament?.status === "finished" && officialSlug && (
            <Link href={`/g/${officialSlug}/leaderboard`} className="btn-primary">
              Ver resultados →
            </Link>
          )}
          <a href={calendarHref} className="btn-secondary" download>
            ⬇ {cfg.calendarLabel}
          </a>
        </div>
      </section>

      {officialSlug && tournament?.status !== "finished" && (
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

      {tournament?.status === "finished" && winners.length > 0 && officialSlug && (
        <section className="mt-16 max-w-3xl mx-auto">
          <div className="cromo bg-grass-500 text-pitch-950 p-6 sm:p-8 text-center rotate-1">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-80">
              Porra oficial · {tournament.name}
            </div>
            <h2 className="font-display text-4xl sm:text-5xl mt-2 uppercase leading-none">
              {winners.length === 1 ? "🥇 GANADOR" : "🥇 EMPATE EN EL PODIO"}
            </h2>
            <div className="mt-5 space-y-2">
              {winners.map((w) => (
                <div key={w.name} className="font-display text-2xl sm:text-3xl uppercase">
                  {w.name}
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-sm opacity-80">
              {winners[0].total} pts · {winners[0].exact} exactos
            </p>
            <div className="mt-5">
              <Link href={`/g/${officialSlug}/leaderboard`} className="btn-secondary">
                Ver clasificación completa →
              </Link>
            </div>
          </div>
        </section>
      )}

      {tournament?.status === "finished" && !officialSlug && (
        <section className="mt-16 max-w-3xl mx-auto">
          <div className="cromo bg-paper-100 text-pitch-700 p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-widest">
              Este torneo ha finalizado.
            </p>
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

      {/* CLASIFICACIÓN (sólo si hay datos publicados de la API) */}
      {standingsGroups.length > 0 && (
        <section className="mt-24 sm:mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal rotate-1">
              📊 CLASIFICACIÓN
            </span>
          </div>
          <StandingsView groups={standingsGroups} />
          <p className="mt-4 text-center font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
            Datos oficiales · actualizado cada hora
          </p>
        </section>
      )}

      {/* CTA FINAL — solo si el torneo sigue abierto */}
      {tournament?.status !== "finished" && (
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
      )}

      <div className="h-24" />
    </div>
  );
}
