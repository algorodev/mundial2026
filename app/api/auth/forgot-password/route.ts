import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  createMagicLink,
  gcMagicLinks,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";
import { sendSetPasswordLink } from "@/lib/email";

// Respuesta genérica: nunca revelamos si el email está registrado o no, así
// no se puede usar este endpoint para enumerar cuentas.
const GENERIC_OK = { ok: true };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail: string = (body?.email ?? "").toString();
    const redirectTo: string | null =
      typeof body?.redirectTo === "string" ? body.redirectTo : null;

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // No mandamos nada pero respondemos ok igualmente para no filtrar
      // qué emails están registrados.
      return NextResponse.json(GENERIC_OK);
    }

    gcMagicLinks().catch(() => {});

    const token = await createMagicLink(email, redirectTo);
    // Si nunca puso password, kind="set" (copy "crea tu contraseña"); si ya
    // tenía, kind="reset" (copy "restablece tu contraseña").
    const kind = user.passwordHash ? "reset" : "set";
    await sendSetPasswordLink(email, token, kind);

    return NextResponse.json(GENERIC_OK);
  } catch (e: any) {
    console.error("forgot-password error:", e);
    return NextResponse.json(
      { error: "No se pudo enviar el correo. Inténtalo en un minuto." },
      { status: 500 }
    );
  }
}
