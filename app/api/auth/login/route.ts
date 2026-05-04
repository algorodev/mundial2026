import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { name, pin } = await req.json();
    if (!name || !pin) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const cleanName = String(name).trim();
    const found = await db
      .select()
      .from(users)
      .where(eq(users.name, cleanName))
      .limit(1);

    if (found.length === 0) {
      return NextResponse.json(
        { error: "Usuario o PIN incorrecto" },
        { status: 401 }
      );
    }

    const user = found[0];
    const ok = await bcrypt.compare(String(pin), user.pinHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Usuario o PIN incorrecto" },
        { status: 401 }
      );
    }

    const token = await createSession({
      userId: user.id,
      name: user.name,
      isAdmin: user.isAdmin === 1,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, isAdmin: user.isAdmin === 1 },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}
