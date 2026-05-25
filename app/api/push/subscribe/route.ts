// /api/push/subscribe
//   POST  → guarda (o refresca) la subscripción del navegador
//   DELETE → la borra (por endpoint, que viene en el body)

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type SubscriptionBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function isValidSub(body: unknown): body is SubscriptionBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.endpoint !== "string" || !b.endpoint) return false;
  const k = b.keys as Record<string, unknown> | undefined;
  if (!k || typeof k.p256dh !== "string" || typeof k.auth !== "string") return false;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }
  if (!isValidSub(body)) {
    return NextResponse.json(
      { error: "subscripción inválida" },
      { status: 400 }
    );
  }

  const ua = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  // Si ya existía con ese endpoint, actualizamos las keys/userAgent y
  // movemos la sub al user actual (por si la suscribió otra cuenta antes
  // en el mismo navegador). Si no, insertamos.
  await db
    .insert(pushSubscriptions)
    .values({
      userId: session.userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: ua,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: session.userId,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: ua,
      },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }
  const endpoint =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).endpoint
      : null;
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "endpoint requerido" }, { status: 400 });
  }
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
  return NextResponse.json({ ok: true });
}
