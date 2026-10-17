// GET /api/kabinet/checkout-token — the checkout asks it before sending the order: a signed-in
// buyer gets a short token (2 hours) that tells Medusa whose cabinet the order goes to; a guest
// gets null. The session itself never leaves the HttpOnly cookie.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { makeAccountToken, readAccountToken } from "@/lib/account/account-token";
import { SESSION_COOKIE } from "@/lib/account/session-cookie";

export const dynamic = "force-dynamic";

export async function GET() {
  const secret = process.env.INTERNAL_API_TOKEN?.trim();
  const customerId = readAccountToken("session", (await cookies()).get(SESSION_COOKIE)?.value, secret);
  const token = customerId && secret ? makeAccountToken("checkout", customerId, secret) : null;
  return NextResponse.json({ token }, { headers: { "cache-control": "private, no-store" } });
}
