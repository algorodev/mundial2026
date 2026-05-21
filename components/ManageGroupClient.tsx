"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GroupSettingsFields, {
  settingsToPayload,
  type GroupSettingsValue,
} from "@/components/GroupSettingsFields";

type Member = {
  userId: number;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

type Request = {
  userId: number;
  name: string;
  email: string;
  requestedAt: string;
};

type InitialSettings = {
  description: string;
  predictionLockMode: "per-match" | "tournament-start";
  lockMinutesBefore: number;
  joinPolicy: "open" | "approval" | "closed";
  joinDeadlineIso: string | null;
  allowLateJoin: boolean;
  predictionsVisibility: "hidden-until-lock" | "open";
};

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export default function ManageGroupClient({
  slug,
  ownerId,
  myUserId,
  inviteCode,
  groupName,
  initialSettings,
  members,
  initialRequests,
}: {
  slug: string;
  ownerId: number;
  myUserId: number;
  inviteCode: string;
  groupName: string;
  initialSettings: InitialSettings;
  members: Member[];
  initialRequests: Request[];
}) {
  const router = useRouter();
  const [list, setList] = useState(members);
  const [requests, setRequests] = useState(initialRequests);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [requestActionId, setRequestActionId] = useState<number | null>(null);

  const [name, setName] = useState(groupName);
  const [settings, setSettings] = useState<GroupSettingsValue>({
    description: initialSettings.description,
    predictionLockMode: initialSettings.predictionLockMode,
    lockMinutesBefore: initialSettings.lockMinutesBefore,
    joinPolicy: initialSettings.joinPolicy,
    joinDeadline: isoToDatetimeLocal(initialSettings.joinDeadlineIso),
    allowLateJoin: initialSettings.allowLateJoin,
    predictionsVisibility: initialSettings.predictionsVisibility,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  const waMessage = `¡Te uno a la porra "${groupName}" en PorraBros! Únete aquí: ${inviteUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function remove(userId: number, n: string) {
    if (!confirm(`¿Expulsar a "${n}" del grupo?`)) return;
    setRemovingId(userId);
    try {
      const r = await fetch(`/api/groups/${slug}/members/${userId}`, {
        method: "DELETE",
      });
      if (r.ok) {
        setList((prev) => prev.filter((m) => m.userId !== userId));
      } else {
        const d = await r.json();
        alert(d.error || "Error");
      }
    } finally {
      setRemovingId(null);
    }
  }

  async function deleteGroup() {
    if (
      !confirm(
        "¿Borrar el grupo entero? Se perderán todas las predicciones y miembros."
      )
    )
      return;
    const r = await fetch(`/api/groups/${slug}`, { method: "DELETE" });
    if (r.ok) {
      router.push("/groups");
      router.refresh();
    } else {
      const d = await r.json();
      alert(d.error || "Error");
    }
  }

  async function approveRequest(userId: number) {
    setRequestActionId(userId);
    try {
      const r = await fetch(`/api/groups/${slug}/requests/${userId}`, {
        method: "POST",
      });
      if (r.ok) {
        const approved = requests.find((x) => x.userId === userId);
        setRequests((prev) => prev.filter((x) => x.userId !== userId));
        if (approved) {
          setList((prev) => [
            ...prev,
            {
              userId: approved.userId,
              name: approved.name,
              email: approved.email,
              role: "member",
              joinedAt: new Date().toISOString(),
            },
          ]);
        }
      } else {
        const d = await r.json();
        alert(d.error || "Error");
      }
    } finally {
      setRequestActionId(null);
    }
  }

  async function rejectRequest(userId: number, n: string) {
    if (!confirm(`¿Rechazar la solicitud de "${n}"?`)) return;
    setRequestActionId(userId);
    try {
      const r = await fetch(`/api/groups/${slug}/requests/${userId}`, {
        method: "DELETE",
      });
      if (r.ok) {
        setRequests((prev) => prev.filter((x) => x.userId !== userId));
      } else {
        const d = await r.json();
        alert(d.error || "Error");
      }
    } finally {
      setRequestActionId(null);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const r = await fetch(`/api/groups/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ...settingsToPayload(settings),
        }),
      });
      if (r.ok) {
        setSavedSettings(true);
        setTimeout(() => setSavedSettings(false), 1500);
        router.refresh();
      } else {
        const d = await r.json();
        setSettingsError(d.error || "Error guardando");
      }
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Solicitudes pendientes (sólo si las hay) */}
      {requests.length > 0 && (
        <section>
          <h3 className="font-display text-2xl sm:text-3xl text-chalk-50 mb-4 uppercase">
            ⏳ Solicitudes pendientes ({requests.length})
          </h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.userId}
                className="cromo bg-paper-50 text-pitch-950 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-display text-lg uppercase tracking-tight truncate">
                    {r.name}
                  </div>
                  <div className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest truncate">
                    {r.email}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approveRequest(r.userId)}
                    disabled={requestActionId === r.userId}
                    className="bg-grass-500 text-paper-50 px-3 py-1.5 font-display text-xs uppercase tracking-widest border-2 border-pitch-950 shadow-brutal-sm hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => rejectRequest(r.userId, r.name)}
                    disabled={requestActionId === r.userId}
                    className="font-mono text-[10px] text-pitch-700 hover:text-brick-500 uppercase tracking-widest font-bold disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invitación */}
      <section>
        <h3 className="font-display text-2xl sm:text-3xl text-chalk-50 mb-4 uppercase">
          🔗 Enlace de invitación
        </h3>
        <div className="cromo bg-pitch-900 p-5 sm:p-6 space-y-4">
          <div className="font-mono text-sm text-chalk-50 break-all bg-pitch-950 px-4 py-3 rounded-sm">
            {inviteUrl}
          </div>
          <div className="flex gap-3 flex-wrap">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
              style={{ background: "#25D366", color: "#0B141A" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-.607z"/>
              </svg>
              Compartir por WhatsApp
            </a>
            <button onClick={copyInvite} className="btn-secondary">
              {copied ? "✓ Copiado" : "Copiar enlace"}
            </button>
            <span className="font-mono text-[11px] text-chalk-400 self-center uppercase tracking-widest">
              Código: <strong className="text-flame-400">{inviteCode}</strong>
            </span>
          </div>
          <p className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
            Cualquiera con este enlace {settings.joinPolicy === "approval"
              ? "podrá solicitar entrar."
              : settings.joinPolicy === "closed"
                ? "verá un mensaje indicando que el grupo está cerrado."
                : "podrá unirse directamente."}
          </p>
        </div>
      </section>

      {/* Configuración */}
      <section>
        <h3 className="font-display text-2xl sm:text-3xl text-chalk-50 mb-4 uppercase">
          ⚙ Configuración
        </h3>
        <form
          onSubmit={saveSettings}
          className="cromo bg-pitch-900 p-5 sm:p-6 space-y-6"
        >
          <div>
            <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
              Nombre del grupo
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={3}
              maxLength={80}
              required
              className="input-base w-full"
            />
          </div>

          <GroupSettingsFields value={settings} onChange={setSettings} />

          {settingsError && (
            <div className="cromo bg-brick-500 text-paper-50 px-4 py-3 font-semibold text-sm">
              ⚠️ {settingsError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary"
            >
              {savingSettings ? "Guardando..." : "Guardar cambios"}
            </button>
            {savedSettings && (
              <span className="font-mono text-[11px] text-grass-400 uppercase tracking-widest font-bold">
                ✓ Guardado
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Miembros */}
      <section>
        <h3 className="font-display text-2xl sm:text-3xl text-chalk-50 mb-4 uppercase">
          👥 Miembros ({list.length})
        </h3>
        <div className="space-y-2">
          {list.map((m) => {
            const isOwner = m.userId === ownerId;
            const isMe = m.userId === myUserId;
            return (
              <div
                key={m.userId}
                className="cromo bg-paper-50 text-pitch-950 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-display text-lg uppercase tracking-tight">
                    {m.name}
                    {isMe && (
                      <span className="ml-2 text-[10px] font-mono uppercase tracking-widest opacity-70">
                        ← TÚ
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-pitch-700 uppercase tracking-widest">
                    {m.email}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isOwner ? (
                    <span className="bg-flame-500 text-pitch-950 font-display text-[10px] px-2 py-1 border-2 border-pitch-950 uppercase tracking-widest">
                      Owner
                    </span>
                  ) : (
                    <button
                      onClick={() => remove(m.userId, m.name)}
                      disabled={removingId === m.userId}
                      className="font-mono text-[10px] text-pitch-700 hover:text-brick-500 uppercase tracking-widest font-bold disabled:opacity-50"
                    >
                      {removingId === m.userId ? "…" : "Expulsar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Zona peligrosa */}
      <section>
        <h3 className="font-display text-2xl sm:text-3xl text-brick-400 mb-4 uppercase">
          ⚠️ Zona peligrosa
        </h3>
        <div className="cromo bg-pitch-900 p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-display text-lg text-chalk-50 uppercase">
              Borrar grupo
            </div>
            <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
              Se perderán predicciones y miembros. No se puede deshacer.
            </div>
          </div>
          <button
            onClick={deleteGroup}
            className="bg-brick-500 text-paper-50 px-5 py-3 font-display text-xs uppercase tracking-widest border-2 border-pitch-950 shadow-brutal-sm hover:-translate-y-0.5 transition-all"
          >
            Borrar grupo
          </button>
        </div>
      </section>
    </div>
  );
}
