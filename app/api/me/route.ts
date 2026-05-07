import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getSession,
  createSession,
  setSessionCookie,
} from "@/lib/session";

// PATCH /api/me — cambia el display name del user logado.
// Devuelve { ok, name } y refresca la cookie de sesión con el nombre nuevo
// para que el NavBar y el header lo reflejen sin tener que volver a logarse.
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name: string = (body?.name ?? "").toString().trim();

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json(
        { error: "El nombre debe tener entre 2 y 60 caracteres" },
        { status: 400 }
      );
    }

    await db.update(users).set({ name }).where(eq(users.id, session.userId));

    // Refresca la cookie con el nombre nuevo para que las server components
    // lean el nuevo display name sin un re-login.
    const jwt = await createSession({
      userId: session.userId,
      email: session.email,
      name,
      isGlobalAdmin: session.isGlobalAdmin,
    });
    await setSessionCookie(jwt);

    return NextResponse.json({ ok: true, name });
  } catch (e) {
    console.error("PATCH /api/me error:", e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
