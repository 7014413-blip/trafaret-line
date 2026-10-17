// Where a visit came from: UTM tags and the Google / Meta click ids of the landing URL.
// A visit with a source replaces the stored one (last non-direct click); visits without one
// keep it for 30 days. cleanAttribution is also what the backend keeps from an order.

import type { Attribution } from "../../types/analytics";

const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;
const MAX_LENGTH = 200;
export const ATTRIBUTION_DAYS = 30;

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_LENGTH);
  return text || undefined;
}

/** Source of a landing URL, or null when it carries none. */
export function attributionFromUrl(url: URL, now: Date): Attribution | null {
  const found: Attribution = {};
  for (const key of KEYS) {
    const value = clean(url.searchParams.get(key));
    if (value) found[key] = value;
  }
  if (!Object.keys(found).length) return null;
  return { ...found, landing: clean(url.pathname), at: now.toISOString() };
}

/** The source to keep: a new one wins, an expired one is dropped. */
export function nextAttribution(stored: Attribution | null, fresh: Attribution | null, now: Date): Attribution | null {
  if (fresh) return fresh;
  if (!stored?.at) return null;
  const age = now.getTime() - new Date(stored.at).getTime();
  return age >= 0 && age <= ATTRIBUTION_DAYS * 86_400_000 ? stored : null;
}

/** Only the known keys, as short plain strings: what the order metadata keeps. */
export function cleanAttribution(value: unknown): Attribution {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const out: Attribution = {};
  for (const key of [...KEYS, "landing", "at"] as const) {
    const text = clean(source[key]);
    if (text) out[key] = text;
  }
  return out;
}
