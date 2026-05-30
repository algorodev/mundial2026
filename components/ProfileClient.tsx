"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileClient({
  initialName,
}: {
  initialName: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = name.trim() !== (initialName ?? "") && name.trim().length >= 2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error guardando");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      // Refresca server components (NavBar, header, leaderboards) para que
      // se vea el nombre nuevo en cuanto cambie.
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="cromo bg-pitch-900 p-5 sm:p-6 space-y-4">
      <div>
        <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
          Nombre que ven los demás
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-base w-full"
          placeholder="Tu nombre"
          minLength={2}
          maxLength={60}
          required
        />
      </div>

      {error && (
        <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!dirty || saving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        {saved && (
          <span className="font-mono text-[11px] text-grass-400 uppercase tracking-widest font-bold">
            ✓ Guardado
          </span>
        )}
      </div>
    </form>
  );
}
