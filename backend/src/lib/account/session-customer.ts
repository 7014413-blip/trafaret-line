// The signed-in customer of a cabinet request: the storefront sends the session token from its
// HttpOnly cookie in the "x-tl-account" header (lib/account/account-token.ts).

import type { MedusaRequest } from "@medusajs/framework/http";
import { readAccountToken } from "../../shared/lib/account/account-token";

export const ACCOUNT_HEADER = "x-tl-account";

/** Customer id of a valid session token, otherwise null. */
export function sessionCustomerId(req: MedusaRequest): string | null {
  const header = req.headers[ACCOUNT_HEADER];
  const token = Array.isArray(header) ? header[0] : header;
  return readAccountToken("session", token, process.env.INTERNAL_API_TOKEN?.trim());
}
