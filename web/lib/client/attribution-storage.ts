// The visit source kept in localStorage (lib/analytics/attribution.ts decides which one wins).

import type { Attribution } from "../../types/analytics";
import { attributionFromUrl, cleanAttribution, nextAttribution } from "../analytics/attribution";
import { readStored, writeStored } from "./browser-storage";

const KEY = "tl-attribution";

function stored(): Attribution | null {
  const raw = readStored("local", KEY);
  if (!raw) return null;
  try {
    const value = cleanAttribution(JSON.parse(raw));
    return Object.keys(value).length ? value : null;
  } catch {
    return null;
  }
}

/** Called on every page: keeps the source of this URL or the still valid earlier one. */
export function rememberAttribution(url: URL, now: Date): void {
  const next = nextAttribution(stored(), attributionFromUrl(url, now), now);
  writeStored("local", KEY, next ? JSON.stringify(next) : null);
}

/** The source to send with an order, empty when none is known. */
export function currentAttribution(now: Date): Attribution {
  return nextAttribution(stored(), null, now) ?? {};
}
