// Customer fonts used by orders (ТЗ §23): the order number is written into the note next to
// the font, and such fonts are kept; a font no order uses is deleted after 30 days
// (lib/text/unused-fonts.ts).

import fs from "node:fs/promises";
import path from "node:path";
import type { FontSidecar } from "../../types/order-files";
import { customFontsDir } from "./node-fonts";

/** File of a stored font and its note. */
export function fontFiles(key: string, dir = customFontsDir()): { file: string; note: string } {
  const file = path.join(dir, ...key.split("/"));
  return { file, note: `${file}.json` };
}

export async function readFontNote(key: string, dir = customFontsDir()): Promise<FontSidecar | null> {
  const text = await fs.readFile(fontFiles(key, dir).note, "utf8").catch(() => null);
  if (!text) return null;
  try {
    return JSON.parse(text) as FontSidecar;
  } catch {
    return null;
  }
}

/** Adds the order to the font's note; the font then stays on the server. */
export async function markFontUsed(key: string, orderNumber: string, dir = customFontsDir()): Promise<void> {
  const note = await readFontNote(key, dir);
  if (!note) return;
  const orders = [...new Set([...(note.orders ?? []), orderNumber])];
  await fs.writeFile(fontFiles(key, dir).note, JSON.stringify({ ...note, orders }));
}
