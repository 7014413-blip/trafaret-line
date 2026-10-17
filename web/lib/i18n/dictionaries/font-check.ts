// Why an uploaded font file cannot be used: the texts of lib/text/font-check.ts. Shared with
// the server, so only relative imports.

import type { Dictionary } from "../../../types/i18n";

export interface FontCheckTexts {
  empty: string;
  tooBig: string;
  woff2: string;
  notFont: string;
  broken: string;
  noLetters: string;
  noOutlines: string;
}

export const FONT_CHECK: Dictionary<FontCheckTexts> = {
  uk: {
    empty: "Файл порожній",
    tooBig: "Файл шрифту більший за 10 МБ",
    woff2: "Файл WOFF2 потрібно спершу розпакувати",
    notFont: "Це не файл шрифту. Підходять TTF, OTF, WOFF або WOFF2",
    broken: "Файл шрифту пошкоджений або не читається",
    noLetters: "У шрифті немає ні українських, ні латинських літер",
    noOutlines: "Літери в шрифті не мають контурів",
  },
  ru: {
    empty: "Файл пустой",
    tooBig: "Файл шрифта больше 10 МБ",
    woff2: "Файл WOFF2 нужно сначала распаковать",
    notFont: "Это не файл шрифта. Подходят TTF, OTF, WOFF или WOFF2",
    broken: "Файл шрифта повреждён или не читается",
    noLetters: "В шрифте нет ни украинских, ни латинских букв",
    noOutlines: "Буквы в шрифте не имеют контуров",
  },
  en: {
    empty: "The file is empty",
    tooBig: "The font file is larger than 10 MB",
    woff2: "The WOFF2 file has to be unpacked first",
    notFont: "This is not a font file. Use TTF, OTF, WOFF or WOFF2",
    broken: "The font file is damaged or cannot be read",
    noLetters: "The font has neither Ukrainian nor Latin letters",
    noOutlines: "The letters in the font have no outlines",
  },
};
