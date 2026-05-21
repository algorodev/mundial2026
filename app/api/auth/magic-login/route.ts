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
import { sendMagicLoginLink } from "@/lib/email";

// Crea un magic link de tipo "login" y lo manda por email si el usuario
// existe. Respuesta siempre genérica para no enumerar cuentas. Si el email
// no está registrado, el frontend muestra el mismo mensaje "revisa tu correo"
// — pero ningún email se envía.
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
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      gcMagicLinks().catch(() => {});
      const token = await createMagicLink(email, redirectTo, "login");
      await sendMagicLoginLink(email, token);
    }

    // Respuesta genérica con o sin user — anti-enumeración.
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("magic-login error:", e);
    return NextResponse.json(
      { error: "No se pudo enviar el enlace. Inténtalo en un minuto." },
      { status: 500 }
    );
  }
}
