// Token for the buyer's invoice link /rakhunok/<order id>?t=<token> (QA 2026-10-10, m14).
// Same algorithm as web/lib/security/order-link.ts: HMAC-SHA256 of "invoice:<order id>" with
// INTERNAL_API_TOKEN, base64url, first 32 characters.

import { createHmac, timingSafeEqual } from "node:crypto";

const PURPOSE = "invoice";
const LENGTH = 32;

export function orderLinkToken(orderId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${PURPOSE}:${orderId}`).digest("base64url").slice(0, LENGTH);
}

/** Token for the order, or null when INTERNAL_API_TOKEN is not set on this server. */
export function invoiceLinkToken(orderId: string): string | null {
  const secret = process.env.INTERNAL_API_TOKEN?.trim();
  return secret ? orderLinkToken(orderId, secret) : null;
}

/** Bearer INTERNAL_API_TOKEN check for server-to-server routes. */
export function isInternalBearer(header: string | string[] | undefined): boolean {
  const secret = process.env.INTERNAL_API_TOKEN?.trim();
  const value = Array.isArray(header) ? header[0] : header;
  if (!secret || !value?.startsWith("Bearer ")) return false;
  const given = Buffer.from(value.slice("Bearer ".length).trim());
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
