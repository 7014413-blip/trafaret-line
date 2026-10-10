// Constructor fonts in the browser: manifest (public/fonts/manifest.json, built by
// scripts/copy-fonts.mjs) and parsed opentype.js faces, cached per font for the session.
// The Medusa server loads the same files from disk (backend/src/shared/lib/text/node-fonts.ts).

import * as opentype from "opentype.js";
import type { FontEntry, LoadedFont } from "../../types/text";

export type { FontEntry, LoadedFont };
export { glyphFor } from "./glyph";

const cache = new Map<string, Promise<LoadedFont>>();

export async function loadFontManifest(): Promise<FontEntry[]> {
  const response = await fetch("/fonts/manifest.json");
  if (!response.ok) throw new Error(`Font manifest: HTTP ${response.status}`);
  return response.json();
}

/** Makes an already parsed font (a customer's own font) loadable by its id. */
export function registerLoadedFont(font: LoadedFont): void {
  cache.set(font.id, Promise.resolve(font));
}

/** Parses every file of the font (Latin and Cyrillic subsets) once. */
export function loadFont(entry: FontEntry): Promise<LoadedFont> {
  let pending = cache.get(entry.id);
  if (!pending) {
    pending = Promise.all(
      entry.files.map(async (file) => {
        const response = await fetch(`/fonts/${file}`);
        if (!response.ok) throw new Error(`Font ${file}: HTTP ${response.status}`);
        return opentype.parse(await response.arrayBuffer());
      }),
    ).then((faces) => ({ ...entry, faces }));
    pending.catch(() => cache.delete(entry.id));
    cache.set(entry.id, pending);
  }
  return pending;
}
