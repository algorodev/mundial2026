"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

export default function JoinClient({
  code,
  requiresApproval,
  deadlineLabel,
}: {
  code: string;
  requiresApproval: boolean;
  deadlineLabel: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function join() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/join/${code}`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || t.join.errorDefault);
        return;
      }
      if (d.status === "pending") {
        setPending(true);
        return;
      }
      router.push(`/g/${d.slug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <div className="space-y-4">
        <div className="cromo bg-grass-500 text-paper-50 p-5 text-center">
          <div className="font-display text-2xl uppercase mb-1">
            {t.join.requestSent}
          </div>
          <p className="text-sm">
            {t.join.requestSentDesc}
          </p>
        </div>
        <Link
          href="/groups"
          className="btn-secondary w-full block text-center"
        >
          {t.join.backToMyPools}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={join} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading
          ? requiresApproval
            ? t.join.requestingButton
            : t.join.joiningButton
          : requiresApproval
            ? t.join.requestButton
            : t.join.joinButton}
        {!loading && <ArrowRight size={18} strokeWidth={2.5} />}
      </button>
      {deadlineLabel && (
        <p className="text-center font-mono text-[11px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
          {t.join.deadline.replace("{date}", deadlineLabel)}
        </p>
      )}
      <Link
        href="/groups"
        className="block text-center font-mono text-[11px] uppercase tracking-widest text-pitch-500 dark:text-chalk-400 hover:text-flame-400"
      >
        {t.join.cancel}
      </Link>
      {error && (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
