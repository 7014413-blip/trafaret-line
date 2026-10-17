// POST /api/kabinet/telegram — end of the Telegram sign-in. /kabinet/vhid-telegram sends the
// data Telegram returned; Medusa checks it and answers with a session, which goes into the
// HttpOnly cookie. Only the site's own pages may call it.

import { NextResponse } from "next/server";
import { signInTelegram } from "@/services/medusa-account";
import { buyerAddress } from "@/lib/account/buyer-address";
import { isSameOrigin } from "@/lib/account/same-origin";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/account/session-cookie";

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { data?: unknown } | null;
  const data = body?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return NextResponse.json({ error: "telegram" }, { status: 400 });
  try {
    const signedIn = await signInTelegram(data as Record<string, unknown>, buyerAddress(request.headers));
    if (!signedIn) return NextResponse.json({ error: "telegram" }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, signedIn.session, sessionCookieOptions(request.headers.get("host")));
    return response;
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
