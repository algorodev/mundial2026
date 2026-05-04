import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

// GET: listar participantes
export async function GET() {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const all = await db.select().from(users);
  return NextResponse.json({
    users: all
      .filter((u) => u.isAdmin === 0)
      .map((u) => ({ id: u.id, name: u.name, createdAt: u.createdAt })),
  });
}

// POST: crear participante con PIN aleatorio (4 dígitos) o el que pase el admin
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { name, pin } = await req.json();
    const cleanName = String(name || "").trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 60) {
      return NextResponse.json(
        { error: "Nombre inválido (2-60 caracteres)" },
        { status: 400 }
      );
    }
    if (cleanName.toLowerCase() === "admin") {
      return NextResponse.json(
        { error: "Nombre reservado" },
        { status: 400 }
      );
    }

    const finalPin =
      pin && String(pin).length >= 4
        ? String(pin)
        : Math.floor(1000 + Math.random() * 9000).toString();

    const hash = await bcrypt.hash(finalPin, 10);

    try {
      await db.insert(users).values({
        name: cleanName,
        pinHash: hash,
        isAdmin: 0,
      });
    } catch (err: any) {
      if (String(err.message || "").includes("unique")) {
        return NextResponse.json(
          { error: "Ya existe un participante con ese nombre" },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      ok: true,
      name: cleanName,
      pin: finalPin, // se devuelve UNA vez para que el admin lo comparta
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
