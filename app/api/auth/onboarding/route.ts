import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession, createSession, setSessionCookie } from "@/lib/session";
import { hashPassword, validatePassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const name: string = (body?.name ?? "").toString().trim();
    const password: string = (body?.password ?? "").toString();

    if (!name || name.length > 60) {
      return NextResponse.json(
        { error: "El nombre es obligatorio (máximo 60 caracteres)" },
        { status: 400 }
      );
    }

    const updates: { name: string; passwordHash?: string } = { name };

    if (password) {
      const passError = validatePassword(password);
      if (passError) {
        return NextResponse.json({ error: passError }, { status: 400 });
      }
      updates.passwordHash = await hashPassword(password);
    }

    await db.update(users).set(updates).where(eq(users.id, session.userId));

    // Refresca el JWT con el nombre ya guardado
    const jwt = await createSession({
      userId: session.userId,
      email: session.email,
      name,
      isGlobalAdmin: session.isGlobalAdmin,
    });
    await setSessionCookie(jwt);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("onboarding error:", e);
    return NextResponse.json(
      { error: "No se pudo guardar el perfil. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
