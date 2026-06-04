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
  "premier-league-2026-27": {
    tournamentSlug: "premier-league-2026-27",
    seoTitle: "Porra Premier League 2026-27 · gratis | PorraBros",
    seoDescription:
      "Crea tu porra de la Premier League 2026-27. 20 equipos, 38 jornadas, leaderboard en directo. Sin instalar nada, gratis.",
    h1: "PORRA DE LA PREMIER LEAGUE 2026-27",
    tagline: "La liga más vista del mundo, en formato porra entre amigos.",
    formatBullets: [
      "20 equipos · 38 jornadas (19 ida + 19 vuelta) · 380 partidos",
      "De agosto de 2026 a mayo de 2027",
      "Tres descensos a Championship · cuatro plazas europeas (Champions + Europa + Conference)",
      "Una jornada por semana — fútbol cada fin de semana de otoño a primavera",
    ],
    intro:
      "La Premier League es la liga más seguida del planeta: estadios llenos cada fin de semana, equipos compitiendo hasta la última jornada y resultados que nadie predice. Perfecta para una porra: una jornada a la semana da tiempo a debatir cada pronóstico antes del siguiente partido. Crea tu grupo en PorraBros, invita por WhatsApp y empieza en agosto.",
    calendarLabel: "Calendario Premier League 2026-27 (.ics)",
    keywords: [
      "porra premier league",
      "porra premier 2026",
      "porra premier 2027",
      "porra premier league entre amigos",
      "quiniela premier league",
    ],
  },
  "premier-2026-27": {
    tournamentSlug: "premier-2026-27",
    seoTitle: "Porra Premier League 2026-27 · gratis | PorraBros",
    seoDescription:
      "Crea tu porra de la Premier League 2026-27. 20 equipos, 38 jornadas, leaderboard en directo. Sin instalar nada, gratis.",
    h1: "PORRA DE LA PREMIER LEAGUE 2026-27",
    tagline: "La liga más vista del mundo, en formato porra entre amigos.",
    formatBullets: [
      "20 equipos · 38 jornadas (19 ida + 19 vuelta) · 380 partidos",
      "De agosto de 2026 a mayo de 2027",
      "Tres descensos a Championship · cuatro plazas europeas (Champions + Europa + Conference)",
      "Una jornada por semana — fútbol cada fin de semana de otoño a primavera",
    ],
    intro:
      "La Premier League es la liga más seguida del planeta: estadios llenos cada fin de semana, equipos compitiendo hasta la última jornada y resultados que nadie predice. Perfecta para una porra: una jornada a la semana da tiempo a debatir cada pronóstico antes del siguiente partido. Crea tu grupo en PorraBros, invita por WhatsApp y empieza en agosto.",
    calendarLabel: "Calendario Premier League 2026-27 (.ics)",
    keywords: [
      "porra premier league",
      "porra premier 2026",
      "porra premier 2027",
      "porra premier league entre amigos",
      "quiniela premier league",
    ],
  },
  "nba-2026-27": {
    tournamentSlug: "nba-2026-27",
    seoTitle: "Porra NBA 2026-27 · gratis | PorraBros",
    seoDescription:
      "Crea tu porra de la NBA 2026-27. Regular season, playoffs y Finals. Leaderboard en directo, sin instalar nada. Gratis.",
    h1: "PORRA DE LA NBA 2026-27",
    tagline: "La mejor liga de baloncesto del mundo, en tu porra entre amigos.",
    formatBullets: [
      "30 equipos divididos en Conferencia Este y Oeste",
      "Regular season: 82 partidos por equipo (octubre 2026 – abril 2027)",
      "Play-In Tournament para los puestos 7 al 10 de cada conferencia",
      "Playoffs al mejor de 7 en cada ronda · NBA Finals en junio",
    ],
    intro:
      "La NBA tiene el mejor show del deporte mundial: canastas de buzzer-beater, triples dobles y sorpresas cada noche. Una porra de temporada regular o de playoffs es la excusa perfecta para seguirla con la pandilla. Crea tu grupo en PorraBros cuando arranque la temporada, invita por WhatsApp y a ver quién mejor conoce a los Suns.",
    calendarLabel: "Calendario NBA 2026-27 (.ics)",
    keywords: [
      "porra nba",
      "porra nba 2026",
      "porra nba 2027",
      "porra baloncesto",
      "quiniela nba",
    ],
  },
  "liga-endesa-2026-27": {
    tournamentSlug: "liga-endesa-2026-27",
    seoTitle: "Porra Liga Endesa 2026-27 · gratis | PorraBros",
    seoDescription:
      "Crea tu porra de la Liga Endesa 2026-27. 18 equipos, liga regular y playoffs. Leaderboard en directo, sin instalar nada.",
    h1: "PORRA DE LA LIGA ENDESA 2026-27",
    tagline: "El baloncesto ACB de primer nivel, en formato porra entre amigos.",
    formatBullets: [
      "18 equipos · liga regular de 34 jornadas (septiembre 2026 – abril 2027)",
      "Copa del Rey en febrero · Final Four en mayo",
      "Playoffs al mejor de 5 en cuartos y semis · final al mejor de 5",
      "El campeón representa a España en la EuroLeague la siguiente temporada",
    ],
    intro:
      "La Liga Endesa ACB es la segunda mejor liga de baloncesto del mundo según la FIBA. Con Real Madrid, Barcelona, Baskonia y Unicaja peleando cada jornada, hay material para debatir pronósticos todo el otoño y la primavera. Crea tu grupo en PorraBros cuando arranque la temporada e invita a tu pandilla.",
    calendarLabel: "Calendario Liga Endesa 2026-27 (.ics)",
    keywords: [
      "porra liga endesa",
      "porra acb",
      "porra baloncesto español",
      "porra liga acb 2026",
      "quiniela liga endesa",
    ],
  },
};

export function getLanding(slug: string): LandingConfig | null {
  return LANDINGS[slug] ?? null;
}
