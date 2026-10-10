// Server-to-server calls (Medusa → storefront), e.g. issuing a fiscal receipt after
// payment. The caller sends "Authorization: Bearer <INTERNAL_API_TOKEN>".

import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { requireEnv } from "../../services/config";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** True when the request carries the internal token. Throws ConfigError when the token is not set. */
export function isInternalRequest(request: Request): boolean {
  const { INTERNAL_API_TOKEN } = requireEnv("internal", ["INTERNAL_API_TOKEN"]);
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;
  return timingSafeEqual(digest(token), digest(INTERNAL_API_TOKEN));
}
