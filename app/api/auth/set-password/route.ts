import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { consumeMagicLink } from "@/lib/auth";
import { hashPassword, validatePassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string = (body?.token ?? "").toString();
    const password: string = (body?.password ?? "").toString();

    if (!token) {
      return NextResponse.json({ error: "Falta el token" }, { status: 400 });
    }
    const passError = validatePassword(password);
    if (passError) {
      return NextResponse.json({ error: passError }, { status: 400 });
    }

    const consumed = await consumeMagicLink(token);
    if (!consumed) {
      return NextResponse.json(
        {
          error:
            "El enlace ya no es válido. Pide otro desde la pantalla de entrada.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Buscar user por email del token. En condiciones normales existe (se
    // creó en /register, en seed, o en admin-link). Si por lo que sea no
    // existe, lo creamos con name = parte local del email — el usuario lo
    // puede cambiar luego en /profile.
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, consumed.email))
      .limit(1);

    if (user) {
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, user.id));
      user = { ...user, passwordHash };
    } else {
      const defaultName = consumed.email.split("@")[0].slice(0, 60);
      [user] = await db
        .insert(users)
        .values({
          email: consumed.email,
          name: defaultName,
          passwordHash,
        })
        .returning();
    }

    const jwt = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      isGlobalAdmin: user.isGlobalAdmin === 1,
    });
    await setSessionCookie(jwt);

    return NextResponse.json({
      ok: true,
      redirectTo: consumed.redirectTo ?? "/groups",
    });
  } catch (e: any) {
    console.error("set-password error:", e);
    return NextResponse.json(
      { error: "No se pudo guardar la contraseña. Inténtalo en un minuto." },
      { status: 500 }
    );
  }
}
