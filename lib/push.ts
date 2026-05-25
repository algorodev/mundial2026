// Helper de Web Push (server-side, Node runtime).
//
// Requiere VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT (un mailto:
// o URL, OBLIGATORIO por la spec). Generación de keys:
//
//   npx web-push generate-vapid-keys
//
// La clave pública se expone vía /api/push/vapid-public-key para que el
// navegador pueda llamar a registration.pushManager.subscribe(). La privada
// firma cada notificación y NUNCA debe salir del servidor.

import webpush from "web-push";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifiedEvents, pushSubscriptions } from "@/lib/db/schema";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    throw new Error(
      "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT no definidos. Genera keys con `npx web-push generate-vapid-keys` y configúralas en Vercel."
    );
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  // Ruta interna que abre al hacer click en la notificación.
  url?: string;
  // tag agrupa notificaciones en el navegador (la nueva reemplaza a la
  // anterior con el mismo tag, evita stacks gigantes).
  tag?: string;
  icon?: string;
  badge?: string;
};

// Envía a un conjunto de usuarios. Filtra subs muertas (410/404) y las
// borra de la DB para que no acumulen basura.
export async function sendToUsers(
  userIds: number[],
  payload: PushPayload
): Promise<{ sent: number; pruned: number }> {
  if (userIds.length === 0) return { sent: 0, pruned: 0 };
  ensureConfigured();

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));

  if (subs.length === 0) return { sent: 0, pruned: 0 };

  const body = JSON.stringify(payload);
  const toPrune: number[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
        sent++;
      } catch (e) {
        const statusCode = (e as { statusCode?: number }).statusCode;
        // 410 Gone / 404 Not Found → subscription muerta, limpiamos.
        if (statusCode === 410 || statusCode === 404) {
          toPrune.push(s.id);
        } else {
          // Otros errores: log y seguimos. Probablemente el endpoint del
          // navegador tuvo un blip; el próximo evento intenta de nuevo.
          console.warn(
            `[push] fallo envío a sub ${s.id}: ${(e as Error).message}`
          );
        }
      }
    })
  );

  if (toPrune.length > 0) {
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.id, toPrune));
  }

  return { sent, pruned: toPrune.length };
}

// Idempotencia de notificaciones por (matchId, eventKey). Devuelve true si
// la marca acaba de crearse (debes enviar la push) y false si ya existía
// (otro tick anterior la mandó).
export async function markEventOnce(
  matchId: number,
  eventKey: string
): Promise<boolean> {
  try {
    const inserted = await db
      .insert(notifiedEvents)
      .values({ matchId, eventKey })
      .onConflictDoNothing()
      .returning({ id: notifiedEvents.id });
    return inserted.length > 0;
  } catch {
    return false;
  }
}

// Comprueba si ya está marcada (sin escribir). Útil para evitar disparar
// trabajo costoso (fetch de events) si todo ya está notificado.
export async function eventAlreadyMarked(
  matchId: number,
  eventKey: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: notifiedEvents.id })
    .from(notifiedEvents)
    .where(
      and(
        eq(notifiedEvents.matchId, matchId),
        eq(notifiedEvents.eventKey, eventKey)
      )
    )
    .limit(1);
  return !!row;
}
