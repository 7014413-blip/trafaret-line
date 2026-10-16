// GET /api/kabinet/google/start — sends the buyer to Google's sign-in page with a random state
// kept in a short HttpOnly cookie; /api/kabinet/google/callback checks it on the way back.

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo/site-url";
import { GOOGLE_CALLBACK_PATH, googleAuthUrl } from "@/lib/account/google-auth-url";
import { cookieOptions, GOOGLE_STATE_COOKIE, GOOGLE_STATE_TTL_S } from "@/lib/account/session-cookie";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return new NextResponse(null, { status: 303, headers: { location: "/kabinet?pomylka=unavailable" } });
  const state = randomBytes(24).toString("base64url");
  const response = new NextResponse(null, { status: 303, headers: { location: googleAuthUrl(clientId, absoluteUrl(GOOGLE_CALLBACK_PATH), state) } });
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions(GOOGLE_STATE_TTL_S, request.headers.get("host"), "/api/kabinet/google"));
  return response;
}
