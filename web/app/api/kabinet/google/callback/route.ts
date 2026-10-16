// GET /api/kabinet/google/callback — Google returns here with ?code&state. The state must be the
// one in the cookie set by /api/kabinet/google/start; Medusa exchanges the code and answers with
// a session, which goes into the HttpOnly cookie. The buyer lands on /kabinet either way.

import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signInGoogle } from "@/services/medusa-account";
import { absoluteUrl } from "@/lib/seo/site-url";
import { buyerAddress } from "@/lib/account/buyer-address";
import { GOOGLE_CALLBACK_PATH } from "@/lib/account/google-auth-url";
import { GOOGLE_STATE_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "@/lib/account/session-cookie";

export const dynamic = "force-dynamic";

const sameState = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

function toCabinet(error?: "google" | "unavailable"): NextResponse {
  const response = new NextResponse(null, { status: 303, headers: { location: error ? `/kabinet?pomylka=${error}` : "/kabinet" } });
  response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/api/kabinet/google", maxAge: 0 });
  return response;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // The buyer pressed «Скасувати» on Google's page: back to the sign-in buttons without an error.
  if (params.get("error")) return toCabinet();
  const code = params.get("code");
  const state = params.get("state");
  const expected = (await cookies()).get(GOOGLE_STATE_COOKIE)?.value;
  if (!code || !state || !expected || !sameState(state, expected)) return toCabinet("google");
  try {
    const signedIn = await signInGoogle(code, absoluteUrl(GOOGLE_CALLBACK_PATH), buyerAddress(request.headers));
    if (!signedIn) return toCabinet("google");
    const response = toCabinet();
    response.cookies.set(SESSION_COOKIE, signedIn.session, sessionCookieOptions(request.headers.get("host")));
    return response;
  } catch {
    return toCabinet("unavailable");
  }
}
