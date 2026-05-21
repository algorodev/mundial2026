import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments } from "@/lib/db/schema";

// Devuelve un archivo .ics con todos los partidos del torneo. Útil para que
// el visitante de la landing añada el calendario a su móvil de un tap.

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ tournamentSlug: string }> }
) {
  const { tournamentSlug } = await props.params;

  const [tournament] = await db
    .select({ id: tournaments.id, name: tournaments.name, slug: tournaments.slug })
    .from(tournaments)
    .where(eq(tournaments.slug, tournamentSlug))
    .limit(1);

  if (!tournament) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  const all = await db
    .select({
      id: matches.id,
      kickoffAt: matches.kickoffAt,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      stadium: matches.stadium,
      groupName: matches.groupName,
      matchNumber: matches.matchNumber,
    })
    .from(matches)
    .where(eq(matches.tournamentId, tournament.id))
    .orderBy(asc(matches.kickoffAt));

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//PorraBros//${tournament.slug}//ES`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${tournament.name}`,
    `X-WR-CALDESC:Calendario de ${tournament.name} en PorraBros`,
    "X-WR-TIMEZONE:Europe/Madrid",
  ];

  for (const m of all) {
    const start = m.kickoffAt;
    const end = new Date(start.getTime() + 105 * 60_000); // 1h45m por partido
    lines.push(
      "BEGIN:VEVENT",
      `UID:porrabros-${tournament.slug}-${m.matchNumber}@porrabros.com`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${escape(`${m.homeTeam} vs ${m.awayTeam}`)}`,
      `DESCRIPTION:${escape(
        [
          m.groupName ? `Grupo ${m.groupName}` : null,
          `Pronostica en https://porrabros.com/porra-${tournament.slug}`,
        ]
          .filter(Boolean)
          .join(" · ")
      )}`,
      ...(m.stadium ? [`LOCATION:${escape(m.stadium)}`] : []),
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n") + "\r\n";

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tournament.slug}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function toIcsDate(d: Date): string {
  // UTC en formato YYYYMMDDTHHMMSSZ
  const iso = d.toISOString();
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
