// POST /api/kabinet/logout — «Вийти»: the session cookie is removed and the buyer sees the
// sign-in buttons again. Only the site's own pages may call it.

import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/account/same-origin";
import { SESSION_COOKIE } from "@/lib/account/session-cookie";

export function POST(request: Request) {
  if (!isSameOrigin(request.headers)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const response = new NextResponse(null, { status: 303, headers: { location: "/kabinet" } });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
