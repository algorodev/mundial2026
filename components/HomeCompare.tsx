import Link from "next/link";

type Cell = { v: boolean | string; note?: string };
type Row = { feature: string; porra: Cell; excel: Cell; biwenger: Cell };

const ROWS: Row[] = [
  {
    feature: "Ranking en directo",
    porra: { v: true, note: "se actualiza solo" },
    excel: { v: false, note: "fórmulas a mano" },
    biwenger: { v: true },
  },
  {
    feature: "Invitas por enlace",
    porra: { v: true, note: "WhatsApp en 5s" },
    excel: { v: false, note: "mandar el archivo" },
    biwenger: { v: true },
  },
  {
    feature: "Varias porras a la vez",
    porra: { v: true, note: "oficina, familia, panda" },
    excel: { v: "parcial", note: "un archivo por porra" },
    biwenger: { v: "parcial" },
  },
  {
    feature: "Hecho para móvil",
    porra: { v: true },
    excel: { v: false, note: "celdas de 4px" },
    biwenger: { v: true },
  },
  {
    feature: "Tus reglas (3-1-0, lock, etc.)",
    porra: { v: true },
    excel: { v: true, note: "si sabes fórmulas" },
    biwenger: { v: false, note: "reglas fijas" },
  },
  {
    feature: "Gratis y sin instalar",
    porra: { v: true },
    excel: { v: "parcial", note: "necesitas Excel" },
    biwenger: { v: "parcial", note: "freemium + app" },
  },
];

export default function HomeCompare() {
  return (
    <section className="mt-24 sm:mt-32 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal -rotate-1">
          🤷 ¿POR QUÉ NO EXCEL?
        </span>
        <p className="mt-5 text-chalk-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Por la misma razón que ya no quedas por SMS. Cuesta lo mismo y
          funciona mejor.
        </p>
      </div>

      <div className="cromo bg-paper-50 text-pitch-950 p-3 sm:p-5 overflow-x-auto">
        <table className="w-full text-sm sm:text-base">
          <thead>
            <tr className="font-display uppercase tracking-tight">
              <th className="text-left py-3 px-2 sm:px-3 border-b-2 border-pitch-950"></th>
              <th className="text-center py-3 px-2 sm:px-3 border-b-2 border-pitch-950 bg-flame-500">
                PorraBros
              </th>
              <th className="text-center py-3 px-2 sm:px-3 border-b-2 border-pitch-950 text-pitch-700">
                Excel
              </th>
              <th className="text-center py-3 px-2 sm:px-3 border-b-2 border-pitch-950 text-pitch-700">
                Biwenger
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.feature}
                className={i % 2 === 0 ? "bg-paper-200" : ""}
              >
                <td className="py-2.5 px-2 sm:px-3 font-display uppercase text-xs sm:text-sm tracking-tight">
                  {row.feature}
                </td>
                <CellEl c={row.porra} highlight />
                <CellEl c={row.excel} />
                <CellEl c={row.biwenger} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/login"
          className="btn-primary inline-block"
        >
          Crear mi porra gratis →
        </Link>
        <p className="mt-3 font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
          30 segundos · sin tarjeta · sin descargas
        </p>
      </div>
    </section>
  );
}

function CellEl({ c, highlight = false }: { c: Cell; highlight?: boolean }) {
  const baseClass = `text-center py-2.5 px-2 sm:px-3 ${
    highlight ? "bg-flame-500/20" : ""
  }`;

  const icon =
    c.v === true ? (
      <span className="text-grass-500 font-display text-xl sm:text-2xl leading-none">
        ✓
      </span>
    ) : c.v === false ? (
      <span className="text-brick-500 font-display text-xl sm:text-2xl leading-none">
        ✗
      </span>
    ) : (
      <span className="text-flame-600 font-display text-xs leading-none uppercase">
        a medias
      </span>
    );

  return (
    <td className={baseClass}>
      <div className="flex flex-col items-center gap-0.5">
        {icon}
        {c.note && (
          <span className="font-mono text-[9px] text-pitch-700 uppercase tracking-widest hidden sm:block">
            {c.note}
          </span>
        )}
      </div>
    </td>
  );
}
