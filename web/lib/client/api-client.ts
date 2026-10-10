// Browser-side calls to the site's own app/api routes. Every answer is either data or
// the ApiErrorBody of lib/api/responses.ts; "not_configured" means the service has no
// keys yet and the form falls back to plain input.

import type { ApiErrorBody } from "../../types/integrations";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiErrorBody | null; status: number };

async function parse<T>(response: Response): Promise<ApiResult<T>> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (response.ok) return { ok: true, data: body as T };
  return { ok: false, error: (body as ApiErrorBody) ?? null, status: response.status };
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<ApiResult<T>> {
  try {
    return await parse<T>(await fetch(url, { signal }));
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    return { ok: false, error: null, status: 0 };
  }
}

export async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<ApiResult<T>> {
  try {
    return await parse<T>(await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal }));
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    return { ok: false, error: null, status: 0 };
  }
}

/** True when the route answered that the service has no keys yet. */
export function notConfigured<T>(result: ApiResult<T>): boolean {
  return !result.ok && result.error?.error === "not_configured";
}
