// Constructor fonts (public/fonts/manifest.json), the customer's own fonts and their
// parsed faces.

import type * as opentype from "opentype.js";

export interface FontEntry {
  id: string;
  name: string;
  group: string;
  /** Font files in public/fonts (Latin and Cyrillic subsets); empty for a customer's font. */
  files: string[];
  /** True for a font the customer uploaded (kept only for them and their orders). */
  custom?: boolean;
}

export type LoadedFont = FontEntry & { faces: opentype.Font[] };

export type CustomFontFormat = "ttf" | "otf" | "woff";

/** Result of checking an uploaded font file in the browser before it is used. */
export interface FontFileCheck {
  ok: boolean;
  /** Ukrainian message when the file cannot be used. */
  error?: string;
  /** Family name from the file, or the file name. */
  familyName: string;
  format?: CustomFontFormat;
  /** Ukrainian letters the font lacks (warning: the text falls back to nothing). */
  missingCyrillic: string[];
  /** Latin letters the font lacks. */
  missingLatin: string[];
  /** Digits the font lacks. */
  missingDigits: string[];
  /** Russian-only letters the font lacks (Ёё Ыы Ээ Ъъ). */
  missingRussian: string[];
  /** Punctuation and signs the font lacks (. , : ; ! ? - « » ( ) ’ & №). */
  missingSigns: string[];
  /** OS/2 fsType «Restricted License embedding»: the author forbids embedding (warning only). */
  embeddingRestricted: boolean;
}

/** A customer's font kept in the browser (IndexedDB) and on the server under `key`. */
export interface CustomFontRecord {
  /** "custom:<key>" — the font id used in the constructor and the order spec. */
  id: string;
  key: string;
  name: string;
  fileName: string;
  format: CustomFontFormat;
  sizeBytes: number;
  /** The customer confirmed they may use this font. */
  rightsConfirmed: true;
  addedAt: string;
}
