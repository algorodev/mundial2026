// GET /api/push/vapid-public-key
// Devuelve la clave pública VAPID en formato base64 url-safe, que es lo que
// pushManager.subscribe({ applicationServerKey }) espera (tras pasar por
// urlBase64ToUint8Array en el cliente).

import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "push no configurado" },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey: key });
}
