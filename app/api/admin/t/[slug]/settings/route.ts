import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session || !session.isGlobalAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { knockoutScoring } = await req.json();
    if (knockoutScoring !== "fulltime" && knockoutScoring !== "extended") {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const result = await db
      .update(tournaments)
      .set({ knockoutScoring })
      .where(eq(tournaments.slug, params.slug))
      .returning({ id: tournaments.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
