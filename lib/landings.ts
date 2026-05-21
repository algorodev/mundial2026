// Configuración de las landings SEO por torneo (/porra-<slug>). Cada entrada
// vive en su propia carpeta `app/porra-<slug>/page.tsx`; el componente
// compartido es `components/TournamentLanding.tsx`.
//
// Para añadir un torneo nuevo:
//  1. Asegúrate de que existe en `tournaments` con el mismo `slug`.
//  2. Añade una entrada aquí.
//  3. Crea `app/porra-<slug>/page.tsx` que llame a `<TournamentLanding cfg={LANDINGS["<slug>"]} />`.

export type LandingConfig = {
  // slug del torneo en la DB (debe coincidir con tournaments.slug)
  tournamentSlug: string;
  // Texto que va al <title> de SEO. < 60 chars
  seoTitle: string;
  seoDescription: string;
  // h1 mostrado en la landing
  h1: string;
  // Tagline corto
  tagline: string;
  // Formato (4-6 puntos, se renderiza como lista)
  formatBullets: string[];
  // Texto introductorio (uno o dos párrafos)
  intro: string;
  // Etiqueta del enlace al calendario
  calendarLabel: string;
  // Keywords adicionales (separadas por coma, opcional para enriquecer meta)
  keywords?: string[];
};

export const LANDINGS: Record<string, LandingConfig> = {
  "mundial-2026": {
    tournamentSlug: "mundial-2026",
    seoTitle: "Porra Mundial 2026 · gratis · entre amigos | PorraBros",
    seoDescription:
      "Crea tu porra del Mundial 2026 en 30 segundos. 48 equipos, 104 partidos, leaderboard en directo. Sin descargas, sin Excel. Gratis.",
    h1: "PORRA DEL MUNDIAL 2026",
    tagline:
      "El Mundial más grande de la historia. La porra entre amigos más sencilla.",
    formatBullets: [
      "48 selecciones, primera vez con tres anfitriones (USA, Canadá y México)",
      "12 grupos de 4 equipos, fase de grupos del 11 al 27 de junio",
      "Eliminatoria desde 1/16 de final · 104 partidos en total",
      "Final el 19 de julio de 2026 en Nueva Jersey",
      "PorraBros incluye los 72 partidos de fase de grupos y se actualiza con los cruces de eliminatoria automáticamente",
    ],
    intro:
      "La porra de toda la vida, en el móvil y con el ranking actualizándose en directo. Crea un grupo para tu pandilla, oficina o familia, invita por WhatsApp en un toque y pronostica los 104 partidos del Mundial 2026. Cada acierto exacto suma 3 puntos, el signo suma 1. Sin instalar nada, sin Excel, sin pagar.",
    calendarLabel: "Calendario del Mundial 2026 (.ics)",
    keywords: [
      "porra mundial 2026",
      "quiniela mundial 2026",
      "porra mundial entre amigos",
      "porra mundial gratis",
      "porra mundial online",
      "porra fútbol 2026",
    ],
  },
  "champions-2025-26": {
    tournamentSlug: "champions-2025-26",
    seoTitle: "Porra Champions League 2025-26 · gratis | PorraBros",
    seoDescription:
      "Crea tu porra de la Champions League 2025-26. Liga de 36 equipos, eliminatorias y final. Leaderboard en directo, invitas por WhatsApp.",
    h1: "PORRA DE LA CHAMPIONS 2025-26",
    tagline:
      "El nuevo formato de la mejor competición de clubes del mundo. Tu porra entre amigos, en directo.",
    formatBullets: [
      "Fase de liga con 36 equipos (formato suizo, 8 jornadas por equipo)",
      "Los 8 primeros pasan directos a octavos · 9º-24º juegan playoff",
      "Eliminatoria desde 1/16 hasta la final · ida y vuelta",
      "Final el 30 de mayo de 2026 en Budapest",
    ],
    intro:
      "El nuevo formato de la Champions ha vuelto la liguilla un puzle perfecto para porras: ocho rondas con cruces distintos cada vez. Crea tu grupo en PorraBros, invita por WhatsApp y compite por adivinar resultados a lo largo de toda la temporada. Aciertos exactos suman 3, signo 1.",
    calendarLabel: "Calendario Champions 2025-26 (.ics)",
    keywords: [
      "porra champions",
      "porra champions league",
      "porra champions 2025",
      "porra champions 2026",
      "quiniela champions",
    ],
  },
  "laliga-2026-27": {
    tournamentSlug: "laliga-2026-27",
    seoTitle: "Porra LaLiga 2026-27 · gratis | PorraBros",
    seoDescription:
      "Crea tu porra de LaLiga 2026-27 con la pandilla. 38 jornadas, 380 partidos, ranking en directo. Sin instalar nada.",
    h1: "PORRA DE LALIGA 2026-27",
    tagline: "Una temporada entera de fútbol, una porra para llevarla con tus amigos.",
    formatBullets: [
      "20 equipos · 38 jornadas (19 ida + 19 vuelta) · 380 partidos",
      "De agosto de 2026 a mayo de 2027",
      "Tres descensos a Segunda · uno o dos cupos europeos según ranking UEFA",
      "Una jornada por semana — el momento perfecto para una porra de oficina",
    ],
    intro:
      "Una jornada por semana durante nueve meses. Cuando estás en la oficina o en la peña, una porra de LaLiga es la excusa perfecta para mantener viva la conversación cada lunes. Crea tu grupo en PorraBros, invita por WhatsApp y compite por toda la temporada. Aciertos exactos suman 3 puntos, signo 1.",
    calendarLabel: "Calendario LaLiga 2026-27 (.ics)",
    keywords: [
      "porra laliga",
      "porra laliga 2026",
      "porra laliga 2027",
      "porra laliga entre amigos",
      "quiniela laliga",
    ],
  },
};

export function getLanding(slug: string): LandingConfig | null {
  return LANDINGS[slug] ?? null;
}
