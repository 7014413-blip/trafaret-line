// Signed link to a stored customer font (ТЗ §23): GET /store/tl-font/file?key=…&exp=…&sig=….
// The font files are never listed or served by name alone; the link is given only to the
// customer who uploaded the font (to unpack WOFF2 in the browser) and expires after 30 days,
// when an unused font is deleted anyway. HMAC-SHA256 with INTERNAL_API_TOKEN, like the invoice link.

import { createHmac, timingSafeEqual } from "node:crypto";

const PURPOSE = "font";
export const FONT_LINK_DAYS = 30;

function signature(key: string, expires: number, secret: string): string {
  return createHmac("sha256", secret).update(`${PURPOSE}:${key}:${expires}`).digest("base64url").slice(0, 43);
}

/** Path and query of the signed link, or null when INTERNAL_API_TOKEN is not set on this server. */
export function fontLink(key: string, now = Date.now()): string | null {
  const secret = process.env.INTERNAL_API_TOKEN?.trim();
  if (!secret) return null;
  const expires = Math.floor(now / 1000) + FONT_LINK_DAYS * 24 * 60 * 60;
  return `/store/tl-font/file?key=${encodeURIComponent(key)}&exp=${expires}&sig=${signature(key, expires, secret)}`;
}

/** True when the link parameters were signed by this server and have not expired. */
export function isValidFontLink(key: string, expires: string, sig: string, now = Date.now()): boolean {
  const secret = process.env.INTERNAL_API_TOKEN?.trim();
  const exp = Number(expires);
  if (!secret || !Number.isInteger(exp) || exp * 1000 < now) return false;
  const expected = Buffer.from(signature(key, exp, secret));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
