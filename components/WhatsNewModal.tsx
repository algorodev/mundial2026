"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/providers/I18nProvider";

const VERSION = "0.4.0";
const STORAGE_KEY = "porrabros_whats_new_seen";

export default function WhatsNewModal() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== VERSION) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, VERSION);
    setVisible(false);
  }

  if (!visible) return null;

  const changes = [
    {
      icon: "🗓",
      title: t.whatsNew.dayCarouselTitle,
      desc: t.whatsNew.dayCarouselDesc,
    },
    {
      icon: "📋",
      title: t.whatsNew.liveMatchDetailTitle,
      desc: t.whatsNew.liveMatchDetailDesc,
    },
    {
      icon: "🛡",
      title: t.whatsNew.teamsTitle,
      desc: t.whatsNew.teamsDesc,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pitch-950/80 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="cromo bg-paper-50 text-pitch-950 max-w-sm w-full p-6 sm:p-8 rotate-[-0.5deg]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="inline-block bg-flame-500 text-pitch-950 font-display text-[10px] px-2.5 py-1 border-2 border-pitch-950 shadow-brutal-sm uppercase tracking-widest">
              {t.whatsNew.badge.replace("{version}", VERSION)}
            </span>
            <h2 className="mt-3 font-display text-3xl uppercase leading-none">
              {t.whatsNew.title}
            </h2>
          </div>
        </div>

        <ul className="space-y-5">
          {changes.map((c) => (
            <li key={c.title} className="flex gap-3">
              <span className="text-2xl leading-none mt-0.5 shrink-0">{c.icon}</span>
              <div>
                <p className="font-display text-base uppercase tracking-tight leading-tight">
                  {c.title}
                </p>
                <p className="mt-1 text-sm text-pitch-600 leading-relaxed">{c.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={dismiss}
          className="btn-primary w-full mt-8 text-center"
        >
          {t.whatsNew.dismiss}
        </button>
      </div>
    </div>
  );
}
