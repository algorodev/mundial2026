// /api/debug/env-check — diagnóstico temporal.
//
// Devuelve si las env vars críticas están presentes en runtime de la function,
// sin exponer valores. Protegido con el mismo Bearer CRON_SECRET que el cron
// para que sólo el operador del proyecto pueda llamarlo.
//
// BORRAR este endpoint en cuanto confirmemos que las VAPID están bien.

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

function check(name: string) {
  const v = process.env[name];
  if (v === undefined) return { defined: false };
  return {
    defined: true,
    length: v.length,
    // Solo confirmamos el carácter de arranque para detectar typos sin
    // exponer la key. "B" para VAPID public (siempre empieza con B en base64
    // url-safe de un punto P-256), "mailto:" para subject, etc.
    starts_with: v.slice(0, 1),
  };
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  return NextResponse.json({
    vercel_env: process.env.VERCEL_ENV ?? null,
    node_env: process.env.NODE_ENV ?? null,
    vars: {
      VAPID_PUBLIC_KEY: check("VAPID_PUBLIC_KEY"),
      VAPID_PRIVATE_KEY: check("VAPID_PRIVATE_KEY"),
      VAPID_SUBJECT: check("VAPID_SUBJECT"),
      CRON_SECRET: check("CRON_SECRET"),
      API_FOOTBALL_KEY: check("API_FOOTBALL_KEY"),
      DATABASE_URL: check("DATABASE_URL"),
    },
  });
}
