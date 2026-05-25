// GET /api/push/vapid-public-key
// Devuelve la clave pública VAPID en formato base64 url-safe, que es lo que
// pushManager.subscribe({ applicationServerKey }) espera (tras pasar por
// urlBase64ToUint8Array en el cliente).
//
// dynamic = "force-dynamic" para leer process.env en cada request: si fuera
// static, Next congela la respuesta en build time y añadir/rotar VAPID_*
// en Vercel no surte efecto hasta el siguiente deploy. El coste es nulo
// (sin DB, sin APIs externas, solo una env y un JSON.stringify).

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
