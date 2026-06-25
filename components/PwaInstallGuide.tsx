"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, MoreVertical } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

type Platform = "ios" | "android";

function IosShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block w-4 h-4 shrink-0 align-middle"
      aria-hidden
    >
      <path d="M12 15V3M8 7l4-4 4 4" />
      <path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}

function PwaModal({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  const { t } = useI18n();
  const ti = t.pwaInstall;
  const [tab, setTab] = useState<Platform>(platform);

  const iosSteps: Array<{ text: string; icon?: React.ReactNode }> = [
    { text: ti.iosStep1 },
    { text: ti.iosStep2, icon: <IosShareIcon /> },
    { text: ti.iosStep3 },
    { text: ti.iosStep4 },
  ];

  const androidSteps: Array<{ text: string; icon?: React.ReactNode }> = [
    { text: ti.androidStep1 },
    { text: ti.androidStep2, icon: <MoreVertical size={14} className="inline-block align-middle shrink-0" aria-hidden /> },
    { text: ti.androidStep3 },
    { text: ti.androidStep4 },
  ];

  const steps = tab === "ios" ? iosSteps : androidSteps;
  const note = tab === "ios" ? ti.iosNote : ti.androidNote;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-pitch-950/80 backdrop-blur-sm" />

      <div
        className="relative w-full sm:max-w-md dark:bg-pitch-900 bg-paper-50 border-t-2 sm:border-2 border-pitch-950 shadow-brutal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b-2 border-pitch-950">
          <div>
            <h2 className="font-display text-base uppercase tracking-widest dark:text-chalk-50 text-pitch-900 leading-tight">
              {ti.modalTitle}
            </h2>
            <p className="text-xs dark:text-chalk-400 text-pitch-500 font-mono mt-1">
              {ti.modalDesc}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-4 dark:text-chalk-400 text-pitch-500 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors"
            aria-label={t.common.close}
          >
            <X size={20} />
          </button>
        </div>

        {/* Platform tabs */}
        <div className="flex border-b-2 border-pitch-950">
          <button
            onClick={() => setTab("ios")}
            className={`flex-1 py-2.5 text-xs font-display uppercase tracking-widest border-r-2 border-pitch-950 transition-colors ${
              tab === "ios"
                ? "bg-flame-500 text-pitch-950"
                : "dark:text-chalk-400 text-pitch-500 dark:hover:bg-pitch-800 hover:bg-paper-100"
            }`}
          >
            {ti.tabIos}
          </button>
          <button
            onClick={() => setTab("android")}
            className={`flex-1 py-2.5 text-xs font-display uppercase tracking-widest transition-colors ${
              tab === "android"
                ? "bg-flame-500 text-pitch-950"
                : "dark:text-chalk-400 text-pitch-500 dark:hover:bg-pitch-800 hover:bg-paper-100"
            }`}
          >
            {ti.tabAndroid}
          </button>
        </div>

        {/* Steps */}
        <div className="p-5 space-y-4">
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-flame-500 border-2 border-pitch-950 flex items-center justify-center text-xs font-display font-bold text-pitch-950">
                  {i + 1}
                </span>
                <span className="text-sm dark:text-chalk-200 text-pitch-800 pt-0.5">
                  {step.text}
                  {step.icon && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 bg-pitch-950/10 dark:bg-chalk-50/10 border border-pitch-950/20 dark:border-chalk-50/20 px-1.5 py-0.5 rounded text-xs">
                      {step.icon}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>

          <p className="text-xs dark:text-chalk-500 text-pitch-400 font-mono border-l-2 border-flame-500 pl-3 leading-relaxed">
            {note}
          </p>
        </div>
      </div>
    </div>
  );
}

interface PwaInstallGuideProps {
  variant: "icon" | "item";
  onBeforeOpen?: () => void;
}

export function PwaInstallGuide({ variant, onBeforeOpen }: PwaInstallGuideProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("ios");
  const { t } = useI18n();

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!standalone) {
      setPlatform(/Android/.test(navigator.userAgent) ? "android" : "ios");
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleOpen() {
    onBeforeOpen?.();
    setOpen(true);
  }

  const label = t.pwaInstall.menuLabel;

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={handleOpen}
          className="dark:text-chalk-400 text-pitch-500 dark:hover:text-chalk-50 hover:text-pitch-900 transition-colors p-1"
          aria-label={label}
        >
          <Download size={16} strokeWidth={2} />
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className="w-full text-left px-6 py-4 flex items-center gap-3 font-display text-xl uppercase tracking-widest dark:text-chalk-50 text-pitch-900 dark:hover:bg-pitch-800 hover:bg-paper-100 hover:text-flame-400 transition-colors"
        >
          <Download size={20} strokeWidth={2} />
          {label}
        </button>
      )}

      {open && createPortal(
        <PwaModal platform={platform} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}
