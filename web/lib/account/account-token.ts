// Signed cabinet tokens "<customer id>.<expiry>.<sig>", the signature an HMAC of
// "account-<purpose>:<customer id>:<expiry>" with INTERNAL_API_TOKEN (shared by the storefront
// and Medusa). Medusa issues a "session" token after the Google or Telegram sign-in; the
// storefront keeps it in an HttpOnly cookie and sends it to Medusa for «Мої замовлення».
// Before the checkout the storefront hands the browser a short "checkout" token made from the
// session, Medusa checks it in tl-checkout and puts the order into the customer's cabinet.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { AccountTokenPurpose } from "../../types/account";

const LENGTH = 32;
/** Session: 30 days, then the customer signs in again. Checkout: enough to fill in the form, useless when leaked. */
export const ACCOUNT_TOKEN_TTL_S: Record<AccountTokenPurpose, number> = {
  session: 30 * 24 * 60 * 60,
  checkout: 2 * 60 * 60,
};

const sign = (purpose: AccountTokenPurpose, customerId: string, expires: number, secret: string) =>
  createHmac("sha256", secret).update(`account-${purpose}:${customerId}:${expires}`).digest("base64url").slice(0, LENGTH);

export function makeAccountToken(purpose: AccountTokenPurpose, customerId: string, secret: string, nowS: number = Math.floor(Date.now() / 1000)): string {
  const expires = nowS + ACCOUNT_TOKEN_TTL_S[purpose];
  return `${customerId}.${expires}.${sign(purpose, customerId, expires, secret)}`;
}

/** The customer id of a valid, unexpired token of this purpose, otherwise null (also without a secret). */
export function readAccountToken(purpose: AccountTokenPurpose, token: unknown, secret: string | undefined, nowS: number = Math.floor(Date.now() / 1000)): string | null {
  if (typeof token !== "string" || !secret) return null;
  const match = /^(cus_[A-Za-z0-9]+)\.(\d{9,11})\.([A-Za-z0-9_-]{32})$/.exec(token);
  if (!match) return null;
  const [, customerId, expiresText, given] = match;
  const expires = Number(expiresText);
  if (expires < nowS || expires > nowS + ACCOUNT_TOKEN_TTL_S[purpose]) return null;
  const expected = Buffer.from(sign(purpose, customerId, expires, secret));
  const got = Buffer.from(given);
  return got.length === expected.length && timingSafeEqual(got, expected) ? customerId : null;
}
