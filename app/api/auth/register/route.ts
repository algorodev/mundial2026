import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isValidEmail, normalizeEmail } from "@/lib/auth";
import { hashPassword, validatePassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/session";

const NAME_MIN = 1;
const NAME_MAX = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail: string = (body?.email ?? "").toString();
    const rawName: string = (body?.name ?? "").toString();
    const password: string = (body?.password ?? "").toString();

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }
    const name = rawName.trim();
    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      return NextResponse.json(
        { error: `El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres` },
        { status: 400 }
      );
    }
    const passError = validatePassword(password);
    if (passError) {
      return NextResponse.json({ error: passError }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Ya hay una cuenta con ese email. Inicia sesión — si no recuerdas la contraseña, te mandaremos un enlace para crearla.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(users)
      .values({ email, name, passwordHash })
      .returning();

    const jwt = await createSession({
      userId: created.id,
      email: created.email,
      name: created.name,
      isGlobalAdmin: created.isGlobalAdmin === 1,
    });
    await setSessionCookie(jwt);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("register error:", e);
    return NextResponse.json(
      { error: "No se pudo crear la cuenta. Inténtalo en un minuto." },
      { status: 500 }
    );
  }
}
