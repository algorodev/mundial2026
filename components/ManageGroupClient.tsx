"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  userId: number;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

export default function ManageGroupClient({
  slug,
  ownerId,
  myUserId,
  inviteCode,
  members,
}: {
  slug: string;
  ownerId: number;
  myUserId: number;
  inviteCode: string;
  members: Member[];
}) {
  const router = useRouter();
  const [list, setList] = useState(members);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function remove(userId: number, name: string) {
    if (!confirm(`¿Expulsar a "${name}" del grupo?`)) return;
    setRemovingId(userId);
    try {
      const r = await fetch(
        `/api/groups/${slug}/members/${userId}`,
        { method: "DELETE" }
      );
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

  return (
    <div className="space-y-10">
      {/* Invitación */}
      <section>
        <h3 className="font-display text-2xl sm:text-3xl text-chalk-50 mb-4 uppercase">
          🔗 Enlace de invitación
        </h3>
        <div className="cromo bg-pitch-900 p-5 sm:p-6 space-y-4">
          <div className="font-mono text-sm text-chalk-50 break-all bg-pitch-950 px-4 py-3 rounded">
            {inviteUrl}
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={copyInvite} className="btn-primary">
              {copied ? "✓ Copiado" : "Copiar enlace"}
            </button>
            <span className="font-mono text-[11px] text-chalk-400 self-center uppercase tracking-widest">
              Código: <strong className="text-flame-400">{inviteCode}</strong>
            </span>
          </div>
          <p className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
            Cualquiera con este enlace puede unirse. Comparte solo con quien
            quieras que entre.
          </p>
        </div>
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
