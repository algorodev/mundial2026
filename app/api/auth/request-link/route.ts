import { NextRequest, NextResponse } from "next/server";
import { createMagicLink, gcMagicLinks, isValidEmail } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body?.email ?? "").toString();
    const redirectTo: string | null =
      typeof body?.redirectTo === "string" ? body.redirectTo : null;

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email no válido" },
        { status: 400 }
      );
    }

    // Limpieza oportunista de tokens caducados
    gcMagicLinks().catch(() => {});

    const token = await createMagicLink(email, redirectTo);
    await sendMagicLink(email, token);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("request-link error:", e);
    // No revelamos si el email está registrado, sólo indicamos error genérico
    return NextResponse.json(
      { error: "No se pudo enviar el correo. Inténtalo en un minuto." },
      { status: 500 }
    );
  }
}
