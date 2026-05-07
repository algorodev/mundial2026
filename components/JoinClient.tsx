"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        setError(d.error || "Error");
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
            ✓ Solicitud enviada
          </div>
          <p className="text-sm">
            El owner del grupo recibirá tu solicitud y decidirá si te admite.
            Te avisaremos en cuanto haya respuesta.
          </p>
        </div>
        <Link
          href="/groups"
          className="btn-secondary w-full block text-center"
        >
          Volver a mis porras
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={join} disabled={loading} className="btn-primary w-full">
        {loading
          ? requiresApproval
            ? "Enviando solicitud..."
            : "Uniéndome..."
          : requiresApproval
            ? "Solicitar entrada →"
            : "Unirme al grupo →"}
      </button>
      {deadlineLabel && (
        <p className="text-center font-mono text-[11px] text-chalk-400 uppercase tracking-widest">
          ⏱ Plazo de inscripción hasta {deadlineLabel}
        </p>
      )}
      <Link
        href="/groups"
        className="block text-center font-mono text-[11px] uppercase tracking-widest text-chalk-400 hover:text-flame-400"
      >
        Cancelar
      </Link>
      {error && (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
