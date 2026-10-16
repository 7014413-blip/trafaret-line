// Constructor fonts for unit tests: the files the storefront serves (public/fonts), read from
// disk and parsed with opentype.js, so geometry runs in Node without a browser.

import fs from "node:fs";
import path from "node:path";
import * as opentype from "opentype.js";
import type { FontEntry, LoadedFont } from "../../../types/text";

const FONTS_DIR = path.resolve(__dirname, "../../../public/fonts");
const cache = new Map<string, LoadedFont>();

function parse(file: string): opentype.Font {
  const buffer = fs.readFileSync(path.join(FONTS_DIR, file));
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
}

/** Font of public/fonts/manifest.json by id, parsed once. */
export function testFont(id: string): LoadedFont {
  const cached = cache.get(id);
  if (cached) return cached;
  const manifest = JSON.parse(fs.readFileSync(path.join(FONTS_DIR, "manifest.json"), "utf8")) as FontEntry[];
  const entry = manifest.find((f) => f.id === id);
  if (!entry) throw new Error(`no font ${id} in public/fonts/manifest.json`);
  const font: LoadedFont = { ...entry, faces: entry.files.map(parse) };
  cache.set(id, font);
  return font;
}
