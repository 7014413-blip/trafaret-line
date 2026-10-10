// fetch with a timeout and JSON parsing for the service clients.

import "server-only";
import type { IntegrationName } from "../types/integrations";
import { UpstreamError } from "./config";

export interface JsonRequest {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export async function fetchJson<T>(service: IntegrationName, url: string, request: JsonRequest = {}): Promise<{ status: number; data: T }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs ?? 15_000);
  let response: Response;
  try {
    response = await fetch(url, {
      method: request.method ?? (request.body === undefined ? "GET" : "POST"),
      headers: { accept: "application/json", ...(request.body === undefined ? {} : { "content-type": "application/json" }), ...request.headers },
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    const reason = (error as Error).name === "AbortError" ? "timeout" : (error as Error).message;
    throw new UpstreamError(service, `${service} is not reachable: ${reason}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new UpstreamError(service, `${service} answered with non-JSON (HTTP ${response.status})`, response.status, text.slice(0, 300));
    }
  }
  return { status: response.status, data: data as T };
}
