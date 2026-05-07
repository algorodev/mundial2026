import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth";
import { createSession, setSessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const url = req.nextUrl.clone();

  if (!token) {
    url.pathname = "/login";
    url.searchParams.set("error", "missing");
    url.search = `?error=missing`;
    return NextResponse.redirect(url);
  }

  const consumed = await consumeMagicLink(token);
  if (!consumed) {
    url.pathname = "/login";
    url.search = `?error=invalid`;
    return NextResponse.redirect(url);
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
  return NextResponse.redirect(url);
}
