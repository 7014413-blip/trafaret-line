// The cabinet session cookie: the Medusa session token (lib/account/account-token.ts), readable
// only by the storefront's server (HttpOnly), sent back to the site only (SameSite=Lax).

import { ACCOUNT_TOKEN_TTL_S } from "./account-token";

export const SESSION_COOKIE = "tl_account";
/** Random state of a Google sign-in, checked on the way back (10 minutes). */
export const GOOGLE_STATE_COOKIE = "tl_google_state";
export const GOOGLE_STATE_TTL_S = 10 * 60;

export interface CookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** Secure (https only) everywhere except a local run on http://127.0.0.1 or localhost. */
export function cookieOptions(maxAge: number, host: string | null, path = "/"): CookieOptions {
  return { httpOnly: true, secure: !LOCAL_HOST.test(host ?? ""), sameSite: "lax", path, maxAge };
}

export const sessionCookieOptions = (host: string | null) => cookieOptions(ACCOUNT_TOKEN_TTL_S.session, host);
