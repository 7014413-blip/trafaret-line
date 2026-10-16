// Where master layout cuts are cached: <MASTERS_CACHE_DIR or backend/uploads/masters>/<article>/.
// The article of a catalogue product is TL-<HANDLE> (the same prefix as its variant SKUs).

import path from "node:path";

export function mastersCacheDir(): string {
  return process.env.MASTERS_CACHE_DIR ?? path.resolve(process.cwd(), "uploads", "masters");
}

export function articleOf(handle: string): string {
  return `TL-${handle.toUpperCase().replace(/[^A-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "")}`;
}
