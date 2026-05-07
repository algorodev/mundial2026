import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth";
import { createSession, setSessionCookie } from "@/lib/session";

// GET: Compatibilidad con emails ya enviados que apuntaban directamente a
// /api/auth/verify. Ya NO consume el token aquí — los prefetchers de los
// clientes de email (Outlook Safe Links, antivirus corporativos, etc.) hacen
// GET sobre el link automáticamente y nos dejaban el token "ya usado" antes
// de que el usuario llegase a pulsarlo.
//
// En su lugar, redirigimos a la página /auth/verify, que pinta un formulario
// con un botón "Entrar" que sí hace POST y sí consume.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const url = req.nextUrl.clone();

  if (!token) {
    url.pathname = "/login";
    url.search = "?error=missing";
    return NextResponse.redirect(url);
  }

  url.pathname = "/auth/verify";
  // mantenemos el token en la query para que la página intermedia lo lea
  url.search = `?token=${encodeURIComponent(token)}`;
  return NextResponse.redirect(url);
}

// POST: lo invoca el formulario de /auth/verify cuando el usuario pulsa
// "Entrar". Consume el token (uso único) y crea la sesión. Como un
// formulario HTML POST hace navegación, devolvemos un redirect 303 para que
// el browser haga GET de la URL final con la cookie ya seteada.
export async function POST(req: NextRequest) {
  const url = req.nextUrl.clone();
  let token = "";
  try {
    const form = await req.formData();
    token = form.get("token")?.toString() ?? "";
  } catch {
    // ignore — token vacío gestionado abajo
  }

  if (!token) {
    url.pathname = "/login";
    url.search = "?error=missing";
    return NextResponse.redirect(url, 303);
  }

  const consumed = await consumeMagicLink(token);
  if (!consumed) {
    url.pathname = "/login";
    url.search = "?error=invalid";
    return NextResponse.redirect(url, 303);
  }

  const jwt = await createSession({
    userId: consumed.userId,
    email: consumed.email,
    name: consumed.name,
    isGlobalAdmin: consumed.isGlobalAdmin,
  });
  await setSessionCookie(jwt);

  const dest = consumed.redirectTo ?? "/groups";
  url.pathname = dest;
  url.search = "";
  return NextResponse.redirect(url, 303);
}
