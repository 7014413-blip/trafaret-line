// Signed links to an order's invoice (QA 2026-10-10, m14): /rakhunok/<order id>?t=<token>.
// The token is an HMAC of the order id with INTERNAL_API_TOKEN, made by the Medusa checkout
// route (backend/src/lib/order-link.ts, the same algorithm) and checked here, so knowing or
// guessing an order id is not enough to see the buyer's requisites.

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const PURPOSE = "invoice";
const LENGTH = 32;

export function orderLinkToken(orderId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${PURPOSE}:${orderId}`).digest("base64url").slice(0, LENGTH);
}

/** True when the token belongs to this order; false as well when the secret is not set. */
export function verifyOrderLink(orderId: string, token: string | null | undefined): boolean {
  if (!token || token.length !== LENGTH) return false;
  const secret = process.env.INTERNAL_API_TOKEN?.trim();
  if (!secret) return false;
  const expected = Buffer.from(orderLinkToken(orderId, secret));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
