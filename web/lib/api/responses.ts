// JSON answers of app/api routes: one error shape for every service (types/integrations.ts).

import { NextResponse } from "next/server";
import type { ApiErrorBody, IntegrationName } from "../../types/integrations";
import { ConfigError, UpstreamError } from "../../services/config";

const STATUS: Record<ApiErrorBody["error"], number> = {
  not_configured: 503,
  bad_request: 400,
  unauthorized: 401,
  rate_limited: 429,
  upstream: 502,
  not_found: 404,
};

export function apiError(service: IntegrationName, error: ApiErrorBody["error"], message: string, extra: Partial<ApiErrorBody> = {}): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error, service, message, ...extra }, { status: STATUS[error] });
}

/** Maps thrown errors to answers: missing keys → 503, provider problems → 502. */
export function handleRouteError(service: IntegrationName, error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ConfigError) {
    return apiError(error.service, "not_configured", "Сервіс ще не підключено: потрібні ключі в налаштуваннях сервера.", { missing: error.missing });
  }
  if (error instanceof UpstreamError) {
    return apiError(error.service, "upstream", error.message, { details: error.details });
  }
  console.error(`[api:${service}]`, error);
  return apiError(service, "upstream", "Внутрішня помилка. Спробуйте ще раз.");
}

/** Reads a JSON body; null when the body is not valid JSON. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
