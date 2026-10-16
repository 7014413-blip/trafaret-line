// Deletes customer fonts that no order uses, 30 days after the upload (ТЗ §23). Fonts of
// orders stay (their note lists the orders), and a copy of every order's fonts is also kept
// in the order folder (lib/orders/write-order-files.ts). Run daily by jobs/delete-unused-fonts.ts.

import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { isValidFontKey } from "../../shared/lib/text/custom-font-id";
import { fontFiles, readFontNote } from "./font-usage";

export const UNUSED_FONT_DAYS = 30;
const DATE_FOLDER = /^\d{4}-\d{2}-\d{2}$/;

/** Upload time of a font: the note, or the date folder when the note is missing. */
function uploadedAt(folder: string, noteAt: string | undefined): number {
  const fromNote = noteAt ? Date.parse(noteAt) : NaN;
  return Number.isFinite(fromNote) ? fromNote : Date.parse(`${folder}T00:00:00Z`);
}

/** Keys of the deleted fonts. */
export async function deleteUnusedFonts(dir: string, now = Date.now(), days = UNUSED_FONT_DAYS): Promise<string[]> {
  const limit = now - days * 24 * 60 * 60 * 1000;
  const deleted: string[] = [];
  const folders = (await fs.readdir(dir, { withFileTypes: true }).catch((): Dirent[] => [])).filter((e) => e.isDirectory() && DATE_FOLDER.test(e.name));
  for (const folder of folders) {
    const names = await fs.readdir(path.join(dir, folder.name));
    for (const name of names.filter((n) => !n.endsWith(".json"))) {
      const key = `${folder.name}/${name}`;
      if (!isValidFontKey(key)) continue;
      const note = await readFontNote(key, dir);
      if (note?.orders?.length || uploadedAt(folder.name, note?.at) > limit) continue;
      const { file, note: notePath } = fontFiles(key, dir);
      await fs.rm(file, { force: true });
      await fs.rm(notePath, { force: true });
      deleted.push(key);
    }
    const left = await fs.readdir(path.join(dir, folder.name));
    if (!left.length) await fs.rmdir(path.join(dir, folder.name));
  }
  return deleted;
}
