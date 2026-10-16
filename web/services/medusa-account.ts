// Medusa's cabinet routes (/store/tl-account), called from the storefront's server: sign-in with
// Google or Telegram and «Мої замовлення». The session token travels only between the two
// servers and the HttpOnly cookie; the buyer's address goes along for Medusa's limits.

import "server-only";
import type { AccountOrdersResponse, AccountSignInResponse } from "../types/account";
import { base } from "./medusa-store";
import { UpstreamError } from "./config";

const ACCOUNT_HEADER = "x-tl-account";

async function call(path: string, init: { method: "GET" | "POST"; body?: unknown; session?: string; address: string | null }): Promise<Response> {
  const { url, key } = base();
  const headers: Record<string, string> = { "x-publishable-api-key": key, accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.session) headers[ACCOUNT_HEADER] = init.session;
  if (init.address) headers["x-real-ip"] = init.address;
  return fetch(`${url}${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
}

/** The new session, or null when Telegram's or Google's answer was refused (401). */
async function signIn(path: string, body: unknown, address: string | null): Promise<AccountSignInResponse | null> {
  const response = await call(path, { method: "POST", body, address });
  if (response.status === 401 || response.status === 400) return null;
  if (!response.ok) throw new UpstreamError("internal", `Medusa ${path}: HTTP ${response.status}`, response.status);
  return (await response.json()) as AccountSignInResponse;
}

export const signInTelegram = (data: Record<string, unknown>, address: string | null) => signIn("/store/tl-account/telegram", { data }, address);

export const signInGoogle = (code: string, redirectUri: string, address: string | null) => signIn("/store/tl-account/google", { code, redirectUri }, address);

/** The customer and their orders, or null when the session is no longer valid. */
export async function loadAccountOrders(session: string, address: string | null): Promise<AccountOrdersResponse | null> {
  const response = await call("/store/tl-account/orders", { method: "GET", session, address });
  if (response.status === 401) return null;
  if (!response.ok) throw new UpstreamError("internal", `Medusa /store/tl-account/orders: HTTP ${response.status}`, response.status);
  return (await response.json()) as AccountOrdersResponse;
}
