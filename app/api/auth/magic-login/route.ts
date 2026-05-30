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

    let [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Si no existe, creamos un stub con solo el email. El nombre se pedirá
    // en /onboarding tras consumir el magic link.
    if (!user) {
      [user] = await db
        .insert(users)
        .values({ email })
        .returning({ id: users.id });
    }

    gcMagicLinks().catch(() => {});
    const token = await createMagicLink(email, redirectTo, "login");
    await sendMagicLoginLink(email, token);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("magic-login error:", e);
    return NextResponse.json(
      { error: "No se pudo enviar el enlace. Inténtalo en un minuto." },
      { status: 500 }
    );
  }
}
