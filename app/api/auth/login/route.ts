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
import { verifyPassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/session";

const GENERIC_ERROR = "Email o contraseña incorrectos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail: string = (body?.email ?? "").toString();
    const password: string = (body?.password ?? "").toString();
    const redirectTo: string | null =
      typeof body?.redirectTo === "string" ? body.redirectTo : null;

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Cuenta transicional: existe en la DB pero aún no tiene password fijada
    // (vienen de la era magic-link, o creadas por seed/admin-link). Mandamos
    // un email para que la fijen — desde ahí entrarán con password.
    if (!user.passwordHash) {
      gcMagicLinks().catch(() => {});
      const token = await createMagicLink(email, redirectTo);
      await sendSetPasswordLink(email, token, "set");
      return NextResponse.json({ ok: true, sentLink: true, email });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const jwt = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      isGlobalAdmin: user.isGlobalAdmin === 1,
    });
    await setSessionCookie(jwt);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("login error:", e);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión. Inténtalo en un minuto." },
      { status: 500 }
    );
  }
}
