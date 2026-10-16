// The font list entry of a loaded font, without its parsed faces (for pickers and saved designs).

import type { FontEntry, LoadedFont } from "../../types/text";

export function fontEntry(font: LoadedFont): FontEntry {
  return { id: font.id, name: font.name, group: font.group, files: font.files, custom: font.custom };
}
