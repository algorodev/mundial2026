"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JoinClient({ code }: { code: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/g/${d.slug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button onClick={join} disabled={loading} className="btn-primary w-full">
        {loading ? "Uniéndome..." : "Unirme al grupo →"}
      </button>
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
