// Fase de grupos del Mundial 2026 - 72 partidos
// Hora en formato 24h en zona horaria peninsular (Europa/Madrid)

export type MatchData = {
  num: number;
  date: string; // "Jue 11 Jun"
  time: string; // "21:00"
  iso: string;  // ISO datetime in UTC
  group: string | null;
  home: string;
  away: string;
  homeFlag: string | null;
  awayFlag: string | null;
  stadium: string | null;
};

const F = {
  MEX: "🇲🇽", RSA: "🇿🇦", KOR: "🇰🇷", CZE: "🇨🇿", CAN: "🇨🇦", BIH: "🇧🇦",
  USA: "🇺🇸", PAR: "🇵🇾", QAT: "🇶🇦", SUI: "🇨🇭", BRA: "🇧🇷", MAR: "🇲🇦",
  HAI: "🇭🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", AUS: "🇦🇺", TUR: "🇹🇷", GER: "🇩🇪", CUW: "🇨🇼",
  NED: "🇳🇱", JPN: "🇯🇵", CIV: "🇨🇮", ECU: "🇪🇨", SWE: "🇸🇪", TUN: "🇹🇳",
  ESP: "🇪🇸", CPV: "🇨🇻", BEL: "🇧🇪", EGY: "🇪🇬", KSA: "🇸🇦", URU: "🇺🇾",
  IRN: "🇮🇷", NZL: "🇳🇿", FRA: "🇫🇷", SEN: "🇸🇳", IRQ: "🇮🇶", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴", POR: "🇵🇹", COD: "🇨🇩",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", CRO: "🇭🇷", GHA: "🇬🇭", PAN: "🇵🇦", UZB: "🇺🇿", COL: "🇨🇴",
};

// Reverse map para sacar el código FIFA desde el emoji guardado en match.homeFlag.
// Lo usa el seed para rellenar homeCode/awayCode sin tener que duplicar la info en
// cada línea de la tabla MATCHES.
const FLAG_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(F).map(([code, flag]) => [flag, code])
);

export function flagToCode(flag: string | null | undefined): string | null {
  if (!flag) return null;
  return FLAG_TO_CODE[flag] ?? null;
}

// Helper: Spain time (UTC+2 in summer = CEST). The PDF shows times in CEST.
// We'll store as ISO UTC = local - 2h.
function iso(dateStr: string, timeStr: string): string {
  // dateStr like "2026-06-11", timeStr like "21:00"
  // CEST is UTC+2 so subtract 2h
  const [Y, M, D] = dateStr.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  const utc = new Date(Date.UTC(Y, M - 1, D, h - 2, m));
  return utc.toISOString();
}

export const MATCHES: MatchData[] = [
  // 11 jun
  { num: 1, date: "Jue 11 Jun", time: "21:00", iso: iso("2026-06-11", "21:00"), group: "A", home: "México", away: "Sudáfrica", homeFlag: F.MEX, awayFlag: F.RSA, stadium: "Ciudad de México" },
  // 12 jun
  { num: 2, date: "Vie 12 Jun", time: "04:00", iso: iso("2026-06-12", "04:00"), group: "A", home: "República de Corea", away: "Chequia", homeFlag: F.KOR, awayFlag: F.CZE, stadium: "Guadalajara" },
  { num: 3, date: "Vie 12 Jun", time: "21:00", iso: iso("2026-06-12", "21:00"), group: "B", home: "Canadá", away: "Bosnia y Herzegovina", homeFlag: F.CAN, awayFlag: F.BIH, stadium: "Toronto" },
  // 13 jun
  { num: 4, date: "Sáb 13 Jun", time: "03:00", iso: iso("2026-06-13", "03:00"), group: "D", home: "EE. UU.", away: "Paraguay", homeFlag: F.USA, awayFlag: F.PAR, stadium: "Los Ángeles" },
  { num: 5, date: "Sáb 13 Jun", time: "21:00", iso: iso("2026-06-13", "21:00"), group: "B", home: "Catar", away: "Suiza", homeFlag: F.QAT, awayFlag: F.SUI, stadium: "Bahía de San Francisco" },
  // 14 jun
  { num: 6, date: "Dom 14 Jun", time: "00:00", iso: iso("2026-06-14", "00:00"), group: "C", home: "Brasil", away: "Marruecos", homeFlag: F.BRA, awayFlag: F.MAR, stadium: "Nueva York/Nueva Jersey" },
  { num: 7, date: "Dom 14 Jun", time: "03:00", iso: iso("2026-06-14", "03:00"), group: "C", home: "Haití", away: "Escocia", homeFlag: F.HAI, awayFlag: F.SCO, stadium: "Boston" },
  { num: 8, date: "Dom 14 Jun", time: "06:00", iso: iso("2026-06-14", "06:00"), group: "D", home: "Australia", away: "Turquía", homeFlag: F.AUS, awayFlag: F.TUR, stadium: "Vancouver" },
  { num: 9, date: "Dom 14 Jun", time: "19:00", iso: iso("2026-06-14", "19:00"), group: "E", home: "Alemania", away: "Curazao", homeFlag: F.GER, awayFlag: F.CUW, stadium: "Houston" },
  { num: 10, date: "Dom 14 Jun", time: "22:00", iso: iso("2026-06-14", "22:00"), group: "F", home: "Países Bajos", away: "Japón", homeFlag: F.NED, awayFlag: F.JPN, stadium: "Dallas" },
  // 15 jun
  { num: 11, date: "Lun 15 Jun", time: "01:00", iso: iso("2026-06-15", "01:00"), group: "E", home: "Costa de Marfil", away: "Ecuador", homeFlag: F.CIV, awayFlag: F.ECU, stadium: "Filadelfia" },
  { num: 12, date: "Lun 15 Jun", time: "04:00", iso: iso("2026-06-15", "04:00"), group: "F", home: "Suecia", away: "Túnez", homeFlag: F.SWE, awayFlag: F.TUN, stadium: "Monterrey" },
  { num: 13, date: "Lun 15 Jun", time: "18:00", iso: iso("2026-06-15", "18:00"), group: "H", home: "España", away: "Islas de Cabo Verde", homeFlag: F.ESP, awayFlag: F.CPV, stadium: "Atlanta" },
  { num: 14, date: "Lun 15 Jun", time: "21:00", iso: iso("2026-06-15", "21:00"), group: "G", home: "Bélgica", away: "Egipto", homeFlag: F.BEL, awayFlag: F.EGY, stadium: "Seattle" },
  // 16 jun
  { num: 15, date: "Mar 16 Jun", time: "00:00", iso: iso("2026-06-16", "00:00"), group: "H", home: "Arabia Saudí", away: "Uruguay", homeFlag: F.KSA, awayFlag: F.URU, stadium: "Miami" },
  { num: 16, date: "Mar 16 Jun", time: "03:00", iso: iso("2026-06-16", "03:00"), group: "G", home: "RI de Irán", away: "Nueva Zelanda", homeFlag: F.IRN, awayFlag: F.NZL, stadium: "Los Ángeles" },
  { num: 17, date: "Mar 16 Jun", time: "21:00", iso: iso("2026-06-16", "21:00"), group: "I", home: "Francia", away: "Senegal", homeFlag: F.FRA, awayFlag: F.SEN, stadium: "Nueva York/Nueva Jersey" },
  // 17 jun
  { num: 18, date: "Mié 17 Jun", time: "00:00", iso: iso("2026-06-17", "00:00"), group: "I", home: "Irak", away: "Noruega", homeFlag: F.IRQ, awayFlag: F.NOR, stadium: "Boston" },
  { num: 19, date: "Mié 17 Jun", time: "03:00", iso: iso("2026-06-17", "03:00"), group: "J", home: "Argentina", away: "Argelia", homeFlag: F.ARG, awayFlag: F.ALG, stadium: "Kansas City" },
  { num: 20, date: "Mié 17 Jun", time: "06:00", iso: iso("2026-06-17", "06:00"), group: "J", home: "Austria", away: "Jordania", homeFlag: F.AUT, awayFlag: F.JOR, stadium: "Bahía de San Francisco" },
  { num: 21, date: "Mié 17 Jun", time: "19:00", iso: iso("2026-06-17", "19:00"), group: "K", home: "Portugal", away: "RD Congo", homeFlag: F.POR, awayFlag: F.COD, stadium: "Houston" },
  { num: 22, date: "Mié 17 Jun", time: "22:00", iso: iso("2026-06-17", "22:00"), group: "L", home: "Inglaterra", away: "Croacia", homeFlag: F.ENG, awayFlag: F.CRO, stadium: "Dallas" },
  // 18 jun
  { num: 23, date: "Jue 18 Jun", time: "01:00", iso: iso("2026-06-18", "01:00"), group: "L", home: "Ghana", away: "Panamá", homeFlag: F.GHA, awayFlag: F.PAN, stadium: "Toronto" },
  { num: 24, date: "Jue 18 Jun", time: "04:00", iso: iso("2026-06-18", "04:00"), group: "K", home: "Uzbekistán", away: "Colombia", homeFlag: F.UZB, awayFlag: F.COL, stadium: "Ciudad de México" },
  { num: 25, date: "Jue 18 Jun", time: "18:00", iso: iso("2026-06-18", "18:00"), group: "A", home: "Chequia", away: "Sudáfrica", homeFlag: F.CZE, awayFlag: F.RSA, stadium: "Atlanta" },
  { num: 26, date: "Jue 18 Jun", time: "21:00", iso: iso("2026-06-18", "21:00"), group: "B", home: "Suiza", away: "Bosnia y Herzegovina", homeFlag: F.SUI, awayFlag: F.BIH, stadium: "Los Ángeles" },
  // 19 jun
  { num: 27, date: "Vie 19 Jun", time: "00:00", iso: iso("2026-06-19", "00:00"), group: "B", home: "Canadá", away: "Catar", homeFlag: F.CAN, awayFlag: F.QAT, stadium: "Vancouver" },
  { num: 28, date: "Vie 19 Jun", time: "03:00", iso: iso("2026-06-19", "03:00"), group: "A", home: "México", away: "República de Corea", homeFlag: F.MEX, awayFlag: F.KOR, stadium: "Guadalajara" },
  { num: 29, date: "Vie 19 Jun", time: "21:00", iso: iso("2026-06-19", "21:00"), group: "D", home: "EE. UU.", away: "Australia", homeFlag: F.USA, awayFlag: F.AUS, stadium: "Seattle" },
  // 20 jun
  { num: 30, date: "Sáb 20 Jun", time: "00:00", iso: iso("2026-06-20", "00:00"), group: "C", home: "Escocia", away: "Marruecos", homeFlag: F.SCO, awayFlag: F.MAR, stadium: "Boston" },
  { num: 31, date: "Sáb 20 Jun", time: "02:30", iso: iso("2026-06-20", "02:30"), group: "C", home: "Brasil", away: "Haití", homeFlag: F.BRA, awayFlag: F.HAI, stadium: "Filadelfia" },
  { num: 32, date: "Sáb 20 Jun", time: "05:00", iso: iso("2026-06-20", "05:00"), group: "D", home: "Turquía", away: "Paraguay", homeFlag: F.TUR, awayFlag: F.PAR, stadium: "Bahía de San Francisco" },
  { num: 33, date: "Sáb 20 Jun", time: "19:00", iso: iso("2026-06-20", "19:00"), group: "F", home: "Países Bajos", away: "Suecia", homeFlag: F.NED, awayFlag: F.SWE, stadium: "Houston" },
  { num: 34, date: "Sáb 20 Jun", time: "22:00", iso: iso("2026-06-20", "22:00"), group: "E", home: "Alemania", away: "Costa de Marfil", homeFlag: F.GER, awayFlag: F.CIV, stadium: "Toronto" },
  // 21 jun
  { num: 35, date: "Dom 21 Jun", time: "02:00", iso: iso("2026-06-21", "02:00"), group: "E", home: "Ecuador", away: "Curazao", homeFlag: F.ECU, awayFlag: F.CUW, stadium: "Kansas City" },
  { num: 36, date: "Dom 21 Jun", time: "06:00", iso: iso("2026-06-21", "06:00"), group: "F", home: "Túnez", away: "Japón", homeFlag: F.TUN, awayFlag: F.JPN, stadium: "Monterrey" },
  { num: 37, date: "Dom 21 Jun", time: "18:00", iso: iso("2026-06-21", "18:00"), group: "H", home: "España", away: "Arabia Saudí", homeFlag: F.ESP, awayFlag: F.KSA, stadium: "Atlanta" },
  { num: 38, date: "Dom 21 Jun", time: "21:00", iso: iso("2026-06-21", "21:00"), group: "G", home: "Bélgica", away: "RI de Irán", homeFlag: F.BEL, awayFlag: F.IRN, stadium: "Los Ángeles" },
  // 22 jun
  { num: 39, date: "Lun 22 Jun", time: "00:00", iso: iso("2026-06-22", "00:00"), group: "H", home: "Uruguay", away: "Islas de Cabo Verde", homeFlag: F.URU, awayFlag: F.CPV, stadium: "Miami" },
  { num: 40, date: "Lun 22 Jun", time: "03:00", iso: iso("2026-06-22", "03:00"), group: "G", home: "Nueva Zelanda", away: "Egipto", homeFlag: F.NZL, awayFlag: F.EGY, stadium: "Vancouver" },
  { num: 41, date: "Lun 22 Jun", time: "19:00", iso: iso("2026-06-22", "19:00"), group: "J", home: "Argentina", away: "Austria", homeFlag: F.ARG, awayFlag: F.AUT, stadium: "Dallas" },
  { num: 42, date: "Lun 22 Jun", time: "23:00", iso: iso("2026-06-22", "23:00"), group: "I", home: "Francia", away: "Irak", homeFlag: F.FRA, awayFlag: F.IRQ, stadium: "Filadelfia" },
  // 23 jun
  { num: 43, date: "Mar 23 Jun", time: "02:00", iso: iso("2026-06-23", "02:00"), group: "I", home: "Noruega", away: "Senegal", homeFlag: F.NOR, awayFlag: F.SEN, stadium: "Nueva York/Nueva Jersey" },
  { num: 44, date: "Mar 23 Jun", time: "05:00", iso: iso("2026-06-23", "05:00"), group: "J", home: "Jordania", away: "Argelia", homeFlag: F.JOR, awayFlag: F.ALG, stadium: "Bahía de San Francisco" },
  { num: 45, date: "Mar 23 Jun", time: "19:00", iso: iso("2026-06-23", "19:00"), group: "K", home: "Portugal", away: "Uzbekistán", homeFlag: F.POR, awayFlag: F.UZB, stadium: "Houston" },
  { num: 46, date: "Mar 23 Jun", time: "22:00", iso: iso("2026-06-23", "22:00"), group: "L", home: "Inglaterra", away: "Ghana", homeFlag: F.ENG, awayFlag: F.GHA, stadium: "Boston" },
  // 24 jun
  { num: 47, date: "Mié 24 Jun", time: "01:00", iso: iso("2026-06-24", "01:00"), group: "L", home: "Panamá", away: "Croacia", homeFlag: F.PAN, awayFlag: F.CRO, stadium: "Toronto" },
  { num: 48, date: "Mié 24 Jun", time: "04:00", iso: iso("2026-06-24", "04:00"), group: "K", home: "Colombia", away: "RD Congo", homeFlag: F.COL, awayFlag: F.COD, stadium: "Guadalajara" },
  { num: 49, date: "Mié 24 Jun", time: "21:00", iso: iso("2026-06-24", "21:00"), group: "B", home: "Suiza", away: "Canadá", homeFlag: F.SUI, awayFlag: F.CAN, stadium: "Vancouver" },
  { num: 50, date: "Mié 24 Jun", time: "21:00", iso: iso("2026-06-24", "21:00"), group: "B", home: "Bosnia y Herzegovina", away: "Catar", homeFlag: F.BIH, awayFlag: F.QAT, stadium: "Seattle" },
  // 25 jun
  { num: 51, date: "Jue 25 Jun", time: "00:00", iso: iso("2026-06-25", "00:00"), group: "C", home: "Escocia", away: "Brasil", homeFlag: F.SCO, awayFlag: F.BRA, stadium: "Miami" },
  { num: 52, date: "Jue 25 Jun", time: "00:00", iso: iso("2026-06-25", "00:00"), group: "C", home: "Marruecos", away: "Haití", homeFlag: F.MAR, awayFlag: F.HAI, stadium: "Atlanta" },
  { num: 53, date: "Jue 25 Jun", time: "03:00", iso: iso("2026-06-25", "03:00"), group: "A", home: "Chequia", away: "México", homeFlag: F.CZE, awayFlag: F.MEX, stadium: "Ciudad de México" },
  { num: 54, date: "Jue 25 Jun", time: "03:00", iso: iso("2026-06-25", "03:00"), group: "A", home: "Sudáfrica", away: "República de Corea", homeFlag: F.RSA, awayFlag: F.KOR, stadium: "Monterrey" },
  { num: 55, date: "Jue 25 Jun", time: "22:00", iso: iso("2026-06-25", "22:00"), group: "E", home: "Curazao", away: "Costa de Marfil", homeFlag: F.CUW, awayFlag: F.CIV, stadium: "Filadelfia" },
  { num: 56, date: "Jue 25 Jun", time: "22:00", iso: iso("2026-06-25", "22:00"), group: "E", home: "Ecuador", away: "Alemania", homeFlag: F.ECU, awayFlag: F.GER, stadium: "Nueva York/Nueva Jersey" },
  // 26 jun
  { num: 57, date: "Vie 26 Jun", time: "01:00", iso: iso("2026-06-26", "01:00"), group: "F", home: "Japón", away: "Suecia", homeFlag: F.JPN, awayFlag: F.SWE, stadium: "Dallas" },
  { num: 58, date: "Vie 26 Jun", time: "01:00", iso: iso("2026-06-26", "01:00"), group: "F", home: "Túnez", away: "Países Bajos", homeFlag: F.TUN, awayFlag: F.NED, stadium: "Kansas City" },
  { num: 59, date: "Vie 26 Jun", time: "04:00", iso: iso("2026-06-26", "04:00"), group: "D", home: "Turquía", away: "EE. UU.", homeFlag: F.TUR, awayFlag: F.USA, stadium: "Los Ángeles" },
  { num: 60, date: "Vie 26 Jun", time: "04:00", iso: iso("2026-06-26", "04:00"), group: "D", home: "Paraguay", away: "Australia", homeFlag: F.PAR, awayFlag: F.AUS, stadium: "Bahía de San Francisco" },
  { num: 61, date: "Vie 26 Jun", time: "21:00", iso: iso("2026-06-26", "21:00"), group: "I", home: "Noruega", away: "Francia", homeFlag: F.NOR, awayFlag: F.FRA, stadium: "Boston" },
  { num: 62, date: "Vie 26 Jun", time: "21:00", iso: iso("2026-06-26", "21:00"), group: "I", home: "Senegal", away: "Irak", homeFlag: F.SEN, awayFlag: F.IRQ, stadium: "Toronto" },
  // 27 jun
  { num: 63, date: "Sáb 27 Jun", time: "02:00", iso: iso("2026-06-27", "02:00"), group: "H", home: "Islas de Cabo Verde", away: "Arabia Saudí", homeFlag: F.CPV, awayFlag: F.KSA, stadium: "Houston" },
  { num: 64, date: "Sáb 27 Jun", time: "02:00", iso: iso("2026-06-27", "02:00"), group: "H", home: "Uruguay", away: "España", homeFlag: F.URU, awayFlag: F.ESP, stadium: "Guadalajara" },
  { num: 65, date: "Sáb 27 Jun", time: "05:00", iso: iso("2026-06-27", "05:00"), group: "G", home: "Egipto", away: "RI de Irán", homeFlag: F.EGY, awayFlag: F.IRN, stadium: "Seattle" },
  { num: 66, date: "Sáb 27 Jun", time: "05:00", iso: iso("2026-06-27", "05:00"), group: "G", home: "Nueva Zelanda", away: "Bélgica", homeFlag: F.NZL, awayFlag: F.BEL, stadium: "Vancouver" },
  { num: 67, date: "Sáb 27 Jun", time: "23:00", iso: iso("2026-06-27", "23:00"), group: "L", home: "Panamá", away: "Inglaterra", homeFlag: F.PAN, awayFlag: F.ENG, stadium: "Nueva York/Nueva Jersey" },
  { num: 68, date: "Sáb 27 Jun", time: "23:00", iso: iso("2026-06-27", "23:00"), group: "L", home: "Croacia", away: "Ghana", homeFlag: F.CRO, awayFlag: F.GHA, stadium: "Filadelfia" },
  // 28 jun
  { num: 69, date: "Dom 28 Jun", time: "01:30", iso: iso("2026-06-28", "01:30"), group: "K", home: "Colombia", away: "Portugal", homeFlag: F.COL, awayFlag: F.POR, stadium: "Miami" },
  { num: 70, date: "Dom 28 Jun", time: "01:30", iso: iso("2026-06-28", "01:30"), group: "K", home: "RD Congo", away: "Uzbekistán", homeFlag: F.COD, awayFlag: F.UZB, stadium: "Atlanta" },
  { num: 71, date: "Dom 28 Jun", time: "04:00", iso: iso("2026-06-28", "04:00"), group: "J", home: "Argelia", away: "Austria", homeFlag: F.ALG, awayFlag: F.AUT, stadium: "Kansas City" },
  { num: 72, date: "Dom 28 Jun", time: "04:00", iso: iso("2026-06-28", "04:00"), group: "J", home: "Jordania", away: "Argentina", homeFlag: F.JOR, awayFlag: F.ARG, stadium: "Dallas" },
];
