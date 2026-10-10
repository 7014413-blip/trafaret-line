// Checks a font file the customer uploads (Денис 10.10): format and size, that it parses,
// that it has outlines, and which Ukrainian, Latin and digit characters it lacks. No I/O,
// so the Medusa server runs the same check on the stored file.

import * as opentype from "opentype.js";
import type { CustomFontFormat, FontFileCheck } from "../../types/text";

export const MAX_FONT_BYTES = 10 * 1024 * 1024;

const UKRAINIAN = "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯабвгґдеєжзиіїйклмнопрстуфхцчшщьюя";
const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const RUSSIAN = "ЁёЫыЭэЪъ";
const SIGNS = ".,:;!?-«»()’&№";
/** At most this many fonts per customer, and this many bytes in total (ТЗ v0.9 §6). */
export const MAX_CUSTOM_FONTS = 10;
export const MAX_CUSTOM_FONTS_BYTES = 30 * 1024 * 1024;

/** Format from the first bytes (the extension is not trusted). WOFF2 is reported separately. */
export function sniffFontFormat(bytes: Uint8Array): CustomFontFormat | "woff2" | null {
  const tag = String.fromCharCode(...bytes.slice(0, 4));
  if (tag === "wOFF") return "woff";
  if (tag === "wOF2") return "woff2";
  if (tag === "OTTO") return "otf";
  if (tag === "true" || (bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0)) return "ttf";
  return null;
}

function missingOf(font: opentype.Font, alphabet: string): string[] {
  return [...alphabet].filter((ch) => font.charToGlyphIndex(ch) <= 0);
}

export function checkFontBuffer(buffer: ArrayBuffer, fileName: string): FontFileCheck & { font?: opentype.Font } {
  const base: FontFileCheck = {
    ok: false, familyName: fileName.replace(/\.[a-z0-9]+$/i, ""), missingCyrillic: [], missingLatin: [], missingDigits: [],
    missingRussian: [], missingSigns: [], embeddingRestricted: false,
  };
  if (buffer.byteLength === 0) return { ...base, error: "Файл порожній" };
  if (buffer.byteLength > MAX_FONT_BYTES) return { ...base, error: "Файл шрифту більший за 10 МБ" };
  const format = sniffFontFormat(new Uint8Array(buffer));
  if (format === "woff2") return { ...base, error: "Формат WOFF2 поки не підтримується. Завантажте той самий шрифт у TTF, OTF або WOFF" };
  if (!format) return { ...base, error: "Це не файл шрифту. Підходять TTF, OTF або WOFF" };

  let font: opentype.Font;
  try {
    font = opentype.parse(buffer);
  } catch {
    return { ...base, format, error: "Файл шрифту пошкоджений або не читається" };
  }
  const familyName = font.names.fontFamily?.uk ?? font.names.fontFamily?.en ?? Object.values(font.names.fontFamily ?? {})[0] ?? base.familyName;
  const missingCyrillic = missingOf(font, UKRAINIAN);
  const missingLatin = missingOf(font, LATIN);
  if (missingCyrillic.length === UKRAINIAN.length && missingLatin.length === LATIN.length) {
    return { ...base, format, familyName, error: "У шрифті немає ні українських, ні латинських літер" };
  }
  // A font of empty boxes: the letter «A»/«А» must have an outline.
  const probe = font.charToGlyphIndex("А") > 0 ? "А" : "A";
  if (!font.charToGlyph(probe).getPath(0, 0, 100).commands.length) {
    return { ...base, format, familyName, error: "Літери в шрифті не мають контурів" };
  }
  // OS/2 fsType bit 1 (0x0002) = Restricted License embedding.
  const fsType = Number((font.tables.os2 as { fsType?: number } | undefined)?.fsType ?? 0);
  return {
    ok: true, format, familyName: String(familyName).slice(0, 80), missingCyrillic, missingLatin,
    missingDigits: missingOf(font, DIGITS), missingRussian: missingOf(font, RUSSIAN), missingSigns: missingOf(font, SIGNS),
    embeddingRestricted: (fsType & 0x000f) === 0x0002, font,
  };
}

/** Characters of the text this font cannot draw (spaces ignored). */
export function unsupportedChars(font: opentype.Font, text: string): string[] {
  return [...new Set([...text].filter((ch) => !/\s/.test(ch) && font.charToGlyphIndex(ch) <= 0))];
}
