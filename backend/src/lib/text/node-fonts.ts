// Constructor fonts on the Medusa server: the same files the storefront serves
// (web/public/fonts, set FONTS_DIR on the server), parsed once and cached. Used to
// recompute the size of «Свій напис» orders instead of trusting the browser.
// Customer fonts ("custom:<key>") are read from backend/uploads/fonts (CUSTOM_FONTS_DIR).

import fs from "node:fs";
import path from "node:path";
import * as opentype from "opentype.js";
import type { FontEntry, LoadedFont } from "../../shared/types/text";
import { customFontKey, isCustomFontId } from "../../shared/lib/text/custom-font-id";

const cache = new Map<string, LoadedFont>();
let manifest: FontEntry[] | null = null;

export function fontsDir(): string {
  return process.env.FONTS_DIR ?? path.resolve(process.cwd(), "..", "web", "public", "fonts");
}

export function customFontsDir(): string {
  return process.env.CUSTOM_FONTS_DIR ?? path.resolve(process.cwd(), "uploads", "fonts");
}

function readManifest(): FontEntry[] {
  if (!manifest) manifest = JSON.parse(fs.readFileSync(path.join(fontsDir(), "manifest.json"), "utf8")) as FontEntry[];
  return manifest;
}

function parseFile(file: string): opentype.Font {
  const buffer = fs.readFileSync(file);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
}

/** Parsed font by manifest id or customer font id; null when it does not exist. */
export function loadFontById(id: string): LoadedFont | null {
  const cached = cache.get(id);
  if (cached) return cached;
  if (isCustomFontId(id)) {
    const key = customFontKey(id);
    if (!key) return null;
    const file = path.join(customFontsDir(), ...key.split("/"));
    if (!fs.existsSync(file)) return null;
    const font: LoadedFont = { id, name: "Шрифт клієнта", group: "custom", files: [], custom: true, faces: [parseFile(file)] };
    // Customer fonts are many and used rarely: keep at most 100 of them parsed.
    const customs = [...cache.keys()].filter(isCustomFontId);
    if (customs.length >= 100) for (const old of customs.slice(0, 50)) cache.delete(old);
    cache.set(id, font);
    return font;
  }
  const entry = readManifest().find((f) => f.id === id);
  if (!entry) return null;
  const font: LoadedFont = { ...entry, faces: entry.files.map((file) => parseFile(path.join(fontsDir(), file))) };
  cache.set(id, font);
  return font;
}
