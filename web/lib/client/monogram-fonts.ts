"use client";

// Fonts of the wedding monograms in the browser: their own manifest
// (public/fonts/monogram-manifest.json, built by scripts/copy-fonts.mjs), parsed once per
// session through the constructor's font cache.

import type { MonogramFontRole } from "../../types/monogram";
import type { FontEntry, LoadedFont } from "../../types/text";
import { loadFont } from "../text/font-loader";
import { MONOGRAM_FONTS } from "../monogram/styles";

let manifest: Promise<FontEntry[]> | null = null;

function monogramManifest(): Promise<FontEntry[]> {
  if (!manifest) {
    manifest = fetch("/fonts/monogram-manifest.json").then((response) => {
      if (!response.ok) throw new Error(`Monogram fonts: HTTP ${response.status}`);
      return response.json() as Promise<FontEntry[]>;
    });
    manifest.catch(() => (manifest = null));
  }
  return manifest;
}

/** Loads the fonts of the given roles; the result has every requested role. */
export async function loadMonogramFonts(roles: ReadonlyArray<MonogramFontRole>): Promise<Partial<Record<MonogramFontRole, LoadedFont>>> {
  const entries = await monogramManifest();
  const loaded = await Promise.all(roles.map(async (role) => {
    const entry = entries.find((e) => e.id === MONOGRAM_FONTS[role]);
    if (!entry) throw new Error(`Monogram font ${MONOGRAM_FONTS[role]} is missing from the manifest`);
    return [role, await loadFont(entry)] as const;
  }));
  return Object.fromEntries(loaded);
}
