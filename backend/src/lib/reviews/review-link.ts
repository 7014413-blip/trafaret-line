// Link for a review of a received order: <storefront>/vidguk/<order id>?t=<token>. The token is
// HMAC-SHA256 of "review:<order id>" with INTERNAL_API_TOKEN (like the invoice link,
// lib/order-link.ts), so only the customer who got the link can review that order.

import { createHmac, timingSafeEqual } from "node:crypto"
import { storefrontUrl } from "../kabinet/storefront"

const PURPOSE = "review"
const LENGTH = 32

export function reviewLinkToken(orderId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${PURPOSE}:${orderId}`).digest("base64url").slice(0, LENGTH)
}

/** The review link of the order, or null when INTERNAL_API_TOKEN is not set on this server. */
export function reviewLink(orderId: string): string | null {
  const secret = process.env.INTERNAL_API_TOKEN?.trim()
  if (!secret) return null
  return `${storefrontUrl()}/vidguk/${encodeURIComponent(orderId)}?t=${reviewLinkToken(orderId, secret)}`
}

/** True when the token belongs to the order; false also when the server has no secret. */
export function reviewTokenValid(orderId: string, token: unknown): boolean {
  const secret = process.env.INTERNAL_API_TOKEN?.trim()
  if (!secret || typeof token !== "string") return false
  const given = Buffer.from(token)
  const expected = Buffer.from(reviewLinkToken(orderId, secret))
  return given.length === expected.length && timingSafeEqual(given, expected)
}
