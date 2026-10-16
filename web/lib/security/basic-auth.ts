// Password for a closed staging copy of the site. STAGING_BASIC_AUTH="login:password" turns it
// on: every page asks for the login in the browser's own dialog, and search engines, link
// previews and strangers get 401. The real shop leaves the variable empty. Runs in the Next.js
// middleware (Edge runtime), so it uses only Web APIs: atob and TextEncoder, no node:crypto.

import type { BasicAuthCredentials } from "../../types/system";

/** Server-to-server routes that carry their own Bearer token (Medusa → storefront). */
const OWN_TOKEN_PATHS = ["/api/revalidate/", "/api/vchasno-kasa/"];

/** Reads "login:password"; null when the value is empty or has no colon. */
export function parseBasicAuthSetting(value: string | undefined): BasicAuthCredentials | null {
  const raw = value?.trim() ?? "";
  const colon = raw.indexOf(":");
  if (colon <= 0 || colon === raw.length - 1) return null;
  return { user: raw.slice(0, colon), password: raw.slice(colon + 1) };
}

/** Decodes "Basic base64(login:password)" from an Authorization header; null when it is not one. */
export function readBasicAuthHeader(header: string | null): BasicAuthCredentials | null {
  if (!header || !header.startsWith("Basic ")) return null;
  let decoded: string;
  try {
    const binary = atob(header.slice(6).trim());
    decoded = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const colon = decoded.indexOf(":");
  if (colon < 0) return null;
  return { user: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
}

/** Compares two strings in time that depends only on their lengths, not on where they differ. */
export function sameSecret(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

/** True when the path is a server-to-server route that checks its own token. */
export function hasOwnToken(pathname: string): boolean {
  return OWN_TOKEN_PATHS.some((prefix) => pathname.startsWith(prefix));
}

/** True when the request may pass: no password set, its own token route, or the right login. */
export function isAllowedByBasicAuth(expected: BasicAuthCredentials | null, pathname: string, header: string | null): boolean {
  if (!expected || hasOwnToken(pathname)) return true;
  const given = readBasicAuthHeader(header);
  if (!given) return false;
  const userOk = sameSecret(given.user, expected.user);
  const passwordOk = sameSecret(given.password, expected.password);
  return userOk && passwordOk;
}
