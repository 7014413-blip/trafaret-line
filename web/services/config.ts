// Server-only configuration of external services. Keys live in web/.env.local on the
// laptop and in the server environment in production, never in the repository.
// A service without its keys answers with a clear "not_configured" error that names
// the missing variables, so the site keeps working without it.

import "server-only";
import type { IntegrationName } from "../types/integrations";

export class ConfigError extends Error {
  constructor(public readonly service: IntegrationName, public readonly missing: string[]) {
    super(`${service}: set ${missing.join(", ")} in the environment`);
    this.name = "ConfigError";
  }
}

export class UpstreamError extends Error {
  constructor(public readonly service: IntegrationName, message: string, public readonly status?: number, public readonly details?: unknown) {
    super(message);
    this.name = "UpstreamError";
  }
}

/** Reads required variables; throws ConfigError listing every missing one. */
export function requireEnv<K extends string>(service: IntegrationName, names: readonly K[]): Record<K, string> {
  const out = {} as Record<K, string>;
  const missing: string[] = [];
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) out[name] = value;
    else missing.push(name);
  }
  if (missing.length) throw new ConfigError(service, missing);
  return out;
}

/** Optional variable with a default. */
export function envOr(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

/** Numeric optional variable with a default. */
export function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
