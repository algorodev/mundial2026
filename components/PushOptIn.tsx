"use client";

import { useEffect, useState } from "react";

// Botón de "activar/desactivar notificaciones" para el grupo. Se ocupa de:
//  - registrar el service worker
//  - pedir Notification.permission
//  - inscribirse a pushManager con la VAPID public key
//  - POST /api/push/subscribe para persistir
//  - DELETE /api/push/subscribe para dar de baja
//
// El estado "activado" lo derivamos de pushManager.getSubscription(), así
// que aunque el usuario desactive desde ajustes del navegador, la UI
// reflejará la realidad la próxima vez que entre.

type Status =
  | { kind: "loading" }
  | { kind: "unsupported"; reason: string }
  | { kind: "ios-needs-pwa" } // iPhone/iPad en Safari fuera de pantalla de inicio
  | { kind: "denied" }
  | { kind: "idle" } // soportado, sin sub
  | { kind: "active"; endpoint: string };

// iOS sólo soporta Web Push cuando la web está instalada como PWA en la
// pantalla de inicio. Detectamos iPhone/iPad (incluyendo iPadOS que se
// disfraza de Mac) y comprobamos display-mode standalone.
function isIOSWithoutPWA(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && "ontouchend" in document);
  if (!isIOS) return false;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return !isStandalone;
}

export default function PushOptIn() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      // iOS Safari: chequeamos PWA antes que serviceWorker porque incluso
      // sin PWA tiene serviceWorker registrable pero el push silenciosamente
      // no funciona. Mostramos instrucción específica.
      if (isIOSWithoutPWA()) {
        setStatus({ kind: "ios-needs-pwa" });
        return;
      }
      if (!("serviceWorker" in navigator)) {
        setStatus({ kind: "unsupported", reason: "Tu navegador no soporta service workers" });
        return;
      }
      if (!("PushManager" in window)) {
        setStatus({ kind: "unsupported", reason: "Tu navegador no soporta Web Push" });
        return;
      }
      if (typeof Notification === "undefined") {
        setStatus({ kind: "unsupported", reason: "Tu navegador no soporta notificaciones" });
        return;
      }
      if (Notification.permission === "denied") {
        setStatus({ kind: "denied" });
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setStatus({ kind: "active", endpoint: existing.endpoint });
        } else {
          setStatus({ kind: "idle" });
        }
      } catch (e) {
        setStatus({ kind: "unsupported", reason: (e as Error).message });
      }
    })();
  }, []);

  async function activate() {
    setBusy(true);
    setErr(null);
    try {
      if (Notification.permission !== "granted") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          if (perm === "denied") setStatus({ kind: "denied" });
          setBusy(false);
          return;
        }
      }
      const r = await fetch("/api/push/vapid-public-key");
      if (!r.ok) throw new Error("VAPID public key no disponible");
      const { publicKey } = await r.json();

      const reg = await navigator.serviceWorker.ready;
      // El cast a BufferSource es necesario por el nuevo lib.dom (TS 6.x)
      // que estrecha el tipo a ArrayBuffer concreto.
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      const post = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!post.ok) {
        const d = await post.json().catch(() => ({}));
        throw new Error(d.error ?? "No se pudo guardar la suscripción");
      }
      setStatus({ kind: "active", endpoint: sub.endpoint });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setBusy(true);
    setErr(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus({ kind: "idle" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (status.kind === "loading") return null;
  if (status.kind === "unsupported") return null; // sin ruido en navegadores que no soportan

  // iOS sin PWA: banner especial con instrucción "Añadir a inicio".
  if (status.kind === "ios-needs-pwa") {
    return (
      <div className="cromo bg-pitch-900 text-chalk-50 px-4 py-3 mb-4">
        <div className="font-display text-sm uppercase tracking-widest mb-1">
          🔔 Notificaciones push
        </div>
        <p className="font-mono text-[10px] text-chalk-400 uppercase tracking-wider leading-relaxed">
          En iPhone necesitas instalar PorraBros para recibirlas. Toca el
          icono de Compartir
          <span className="mx-1 inline-block bg-paper-50 text-pitch-950 px-1.5 py-0.5 rounded-sm font-display text-[10px]">
            ⬆️
          </span>
          en Safari y elige <strong>Añadir a pantalla de inicio</strong>.
          Luego abre la app desde el icono y vuelve aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="cromo bg-pitch-900 text-chalk-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="min-w-0">
        <div className="font-display text-sm uppercase tracking-widest">
          🔔 Notificaciones push
        </div>
        <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest mt-0.5">
          {status.kind === "active"
            ? "Activas en este dispositivo"
            : status.kind === "denied"
              ? "Bloqueadas en tu navegador"
              : "Avisos de goles, finales y arranque de partido"}
        </div>
        {err && (
          <div className="font-mono text-[10px] text-brick-400 uppercase tracking-widest mt-1">
            {err}
          </div>
        )}
      </div>
      {status.kind === "denied" ? (
        <span className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
          Cámbialo en ajustes del sitio
        </span>
      ) : status.kind === "active" ? (
        <button
          onClick={deactivate}
          disabled={busy}
          className="font-display text-xs uppercase tracking-widest px-3 py-2 bg-paper-50 text-pitch-950 border-2 border-pitch-950 shadow-brutal-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          {busy ? "…" : "Desactivar"}
        </button>
      ) : (
        <button
          onClick={activate}
          disabled={busy}
          className="font-display text-xs uppercase tracking-widest px-3 py-2 bg-flame-500 text-pitch-950 border-2 border-pitch-950 shadow-brutal-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50"
        >
          {busy ? "…" : "Activar"}
        </button>
      )}
    </div>
  );
}

// La applicationServerKey de pushManager espera Uint8Array, no string. Esta
// es la conversión estándar de base64-url a bytes.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
