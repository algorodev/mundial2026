import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { consumeMagicLink } from "@/lib/auth";
import { createSession, setSessionCookie } from "@/lib/session";

// Consume un token de "magic-login" y firma sesión. Sólo acepta tokens con
// purpose=login; los de set-password/reset siguen yendo a /api/auth/set-password.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string = (body?.token ?? "").toString();

    if (!token) {
      return NextResponse.json({ error: "Falta el token" }, { status: 400 });
    }

    const consumed = await consumeMagicLink(token);
    if (!consumed || consumed.purpose !== "login") {
      return NextResponse.json(
        {
          error:
            "El enlace ya no es válido. Pide otro desde la pantalla de entrada.",
        },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, consumed.email))
      .limit(1);

    // Anti-enumeración: si el usuario fue borrado entre la creación del link
    // y el consumo, fallamos con el mismo mensaje genérico.
    if (!user) {
      return NextResponse.json(
        {
          error:
            "El enlace ya no es válido. Pide otro desde la pantalla de entrada.",
        },
        { status: 400 }
      );
    }

    const jwt = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name ?? null,
      isGlobalAdmin: user.isGlobalAdmin === 1,
    });
    await setSessionCookie(jwt);

    // Usuario sin nombre → onboarding antes de entrar al destino final
    const finalDest = consumed.redirectTo ?? "/groups";
    const redirectTo = !user.name
      ? `/onboarding?next=${encodeURIComponent(finalDest)}`
      : finalDest;

    return NextResponse.json({ ok: true, redirectTo });
  } catch (e: any) {
    console.error("magic-login consume error:", e);
    return NextResponse.json(
      { error: "No se pudo iniciar sesión. Inténtalo en un minuto." },
      { status: 500 }
    );
  }
}
