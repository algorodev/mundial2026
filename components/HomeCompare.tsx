"use client";

import Link from "next/link";
import { useI18n } from "@/providers/I18nProvider";

type Cell = { v: boolean | string; note?: string };
type Row = { featureKey: string; porra: Cell; excel: Cell; biwenger: Cell };

export default function HomeCompare() {
  const { t } = useI18n();

  const ROWS: Row[] = [
    {
      featureKey: "featureLiveRanking",
      porra: { v: true, note: t.homeCompare.porraLiveNote },
      excel: { v: false, note: t.homeCompare.excelLiveNote },
      biwenger: { v: true },
    },
    {
      featureKey: "featureInviteLink",
      porra: { v: true, note: t.homeCompare.porraInviteNote },
      excel: { v: false, note: t.homeCompare.excelInviteNote },
      biwenger: { v: true },
    },
    {
      featureKey: "featureMultiplePools",
      porra: { v: true, note: t.homeCompare.porraMultipleNote },
      excel: { v: "parcial", note: t.homeCompare.excelMultipleNote },
      biwenger: { v: "parcial", note: t.homeCompare.biwengerMultipleNote },
    },
    {
      featureKey: "featureMobile",
      porra: { v: true },
      excel: { v: false, note: t.homeCompare.excelMobileNote },
      biwenger: { v: true },
    },
    {
      featureKey: "featureCustomRules",
      porra: { v: true },
      excel: { v: true, note: t.homeCompare.excelRulesNote },
      biwenger: { v: false, note: t.homeCompare.biwengerRulesNote },
    },
    {
      featureKey: "featureFree",
      porra: { v: true },
      excel: { v: "parcial", note: t.homeCompare.excelFreeNote },
      biwenger: { v: "parcial", note: t.homeCompare.biwengerFreeNote },
    },
  ];

  return (
    <section className="mt-24 sm:mt-32 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal -rotate-1">
          {t.homeCompare.title}
        </span>
        <p className="mt-5 text-chalk-200 dark:text-chalk-200 text-pitch-700 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          {t.homeCompare.subtitle}
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
                key={row.featureKey}
                className={i % 2 === 0 ? "bg-paper-200" : ""}
              >
                <td className="py-2.5 px-2 sm:px-3 font-display uppercase text-xs sm:text-sm tracking-tight">
                  {t.homeCompare[row.featureKey as keyof typeof t.homeCompare] as string}
                </td>
                <CellEl c={row.porra} highlight partial={t.homeCompare.partial} />
                <CellEl c={row.excel} partial={t.homeCompare.partial} />
                <CellEl c={row.biwenger} partial={t.homeCompare.partial} />
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
          {t.homeCompare.cta}
        </Link>
        <p className="mt-3 font-mono text-[10px] text-chalk-400 dark:text-chalk-400 text-pitch-500 uppercase tracking-widest">
          {t.homeCompare.ctaNote}
        </p>
      </div>
    </section>
  );
}

function CellEl({ c, highlight = false, partial }: { c: Cell; highlight?: boolean; partial: string }) {
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
        {partial}
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
