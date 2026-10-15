// Monogram designs of the site, all drawn for Trafaret Line (Денис's samples were used only
// as the idea: two initials, ampersand, arc, branch, date). Coordinates are units of a
// 100 × 100 box, y grows down; lib/monogram/build-design.ts scales the box into the sheet.
// Strokes are at least ~1.2 units wide so they stay above the 1 mm slot at 8 × 8 cm; on the
// two smallest sheets the builder widens them to the slot limit.

import type { MonogramFontRole, MonogramStyle, MonogramStyleId } from "../../types/monogram";

/** Font of every role: ids of public/fonts/monogram-manifest.json (Latin and Cyrillic). */
export const MONOGRAM_FONTS: Record<MonogramFontRole, string> = {
  serif: "mono-playfair",
  italic: "mono-playfair-italic",
  script: "mono-marck",
  date: "mono-lora",
};

/** Hairline of each font as a share of its capital height (measured on «Н», «A», «&»). */
export const MONOGRAM_HAIRLINE_SHARE: Record<MonogramFontRole, number> = {
  serif: 0.035,
  italic: 0.035,
  script: 0.07,
  date: 0.08,
};

const DATE_SAMPLE = "27.09.2026";

export const MONOGRAM_STYLES: Record<MonogramStyleId, MonogramStyle> = {
  "vine-date": {
    id: "vine-date",
    name: { uk: "Гілочка й дуга", ru: "Веточка и дуга" },
    fields: ["first", "second", "date"],
    sample: { first: "А", second: "Д", date: DATE_SAMPLE },
    elements: [
      { kind: "arc", cx: 51, cy: 46, r: 37, from: -78, to: 104, width: 1.5 },
      {
        kind: "branch", path: { type: "arc", cx: 51, cy: 46, r: 37, from: 104, to: 200 },
        width: 1.3, leafLength: 8.5, leafWidth: 3.6, leafStep: 8, leafAngle: 38, bareStart: 9, layout: "both",
      },
      { kind: "first", font: "serif", cx: 36, cy: 30, cap: 26, maxWidth: 30 },
      { kind: "amp", font: "italic", cx: 50, cy: 44, cap: 17, maxWidth: 18 },
      { kind: "second", font: "serif", cx: 65, cy: 56, cap: 26, maxWidth: 30 },
      { kind: "date", font: "date", cx: 51, cy: 92, cap: 7.5, maxWidth: 62 },
    ],
  },
  "wreath-date": {
    id: "wreath-date",
    name: { uk: "Вінок", ru: "Венок" },
    fields: ["first", "second", "date"],
    sample: { first: "О", second: "М", date: DATE_SAMPLE },
    elements: [
      {
        kind: "branch", path: { type: "arc", cx: 50, cy: 47, r: 43, from: 101, to: 208 },
        width: 1.3, leafLength: 8, leafWidth: 3.4, leafStep: 7.5, leafAngle: 36, bareStart: 4, layout: "both",
      },
      {
        kind: "branch", path: { type: "arc", cx: 50, cy: 47, r: 43, from: 79, to: -28 },
        width: 1.3, leafLength: 8, leafWidth: 3.4, leafStep: 7.5, leafAngle: 36, bareStart: 4, layout: "both",
      },
      { kind: "heart", cx: 50, cy: 90.5, size: 6.5 },
      { kind: "first", font: "serif", cx: 30, cy: 41, cap: 25, maxWidth: 25 },
      { kind: "amp", font: "italic", cx: 50, cy: 43, cap: 14, maxWidth: 12 },
      { kind: "second", font: "serif", cx: 70, cy: 41, cap: 25, maxWidth: 25 },
      { kind: "date", font: "date", cx: 50, cy: 66, cap: 7, maxWidth: 48 },
    ],
  },
  "script-date": {
    id: "script-date",
    name: { uk: "Каліграфія", ru: "Каллиграфия" },
    fields: ["first", "second", "date"],
    sample: { first: "Т", second: "В", date: DATE_SAMPLE },
    elements: [
      { kind: "first", font: "script", cx: 29, cy: 42, cap: 34, maxWidth: 34 },
      { kind: "heart", cx: 50, cy: 47, size: 9 },
      { kind: "second", font: "script", cx: 71, cy: 42, cap: 34, maxWidth: 34 },
      { kind: "line", x1: 6, y1: 80, x2: 22, y2: 80, width: 1.2 },
      { kind: "date", font: "date", cx: 50, cy: 80, cap: 8, maxWidth: 50 },
      { kind: "line", x1: 78, y1: 80, x2: 94, y2: 80, width: 1.2 },
    ],
  },
  "diagonal-classic": {
    id: "diagonal-classic",
    name: { uk: "Діагональ", ru: "Диагональ" },
    fields: ["first", "second"],
    sample: { first: "A", second: "D", date: "" },
    elements: [
      { kind: "first", font: "serif", cx: 31, cy: 35, cap: 40, maxWidth: 46 },
      { kind: "second", font: "serif", cx: 69, cy: 63, cap: 40, maxWidth: 46 },
      { kind: "amp", font: "italic", cx: 50, cy: 50, cap: 32, maxWidth: 26, overLetters: true },
    ],
  },
  "diagonal-arc": {
    id: "diagonal-arc",
    name: { uk: "Діагональ у дузі", ru: "Диагональ в дуге" },
    fields: ["first", "second"],
    sample: { first: "A", second: "D", date: "" },
    elements: [
      { kind: "arc", cx: 50, cy: 50, r: 46, from: -62, to: 208, width: 1.5 },
      { kind: "first", font: "serif", cx: 35, cy: 38, cap: 32, maxWidth: 36 },
      { kind: "second", font: "serif", cx: 65, cy: 62, cap: 32, maxWidth: 36 },
      { kind: "amp", font: "italic", cx: 50, cy: 50, cap: 26, maxWidth: 21, overLetters: true },
    ],
  },
  "sprig-line": {
    id: "sprig-line",
    name: { uk: "Гілочка й лінія", ru: "Веточка и линия" },
    fields: ["first", "second"],
    sample: { first: "D", second: "J", date: "" },
    elements: [
      { kind: "line", x1: 50, y1: 6, x2: 50, y2: 33, width: 1.6 },
      {
        kind: "branch", path: { type: "line", x1: 50, y1: 68, x2: 50, y2: 37 },
        width: 1.3, leafLength: 10.5, leafWidth: 4.8, leafStep: 6, leafAngle: 46, bareStart: 9, layout: "both",
      },
      { kind: "line", x1: 50, y1: 71, x2: 50, y2: 94, width: 1.6 },
      { kind: "first", font: "serif", cx: 30, cy: 52, cap: 23, maxWidth: 28 },
      { kind: "second", font: "serif", cx: 70, cy: 52, cap: 23, maxWidth: 28 },
    ],
  },
  "heart-line": {
    id: "heart-line",
    name: { uk: "Серце й лінія", ru: "Сердце и линия" },
    fields: ["first", "second"],
    sample: { first: "D", second: "J", date: "" },
    elements: [
      { kind: "line", x1: 50, y1: 6, x2: 50, y2: 40, width: 1.6 },
      { kind: "heart", cx: 50, cy: 51, size: 10 },
      { kind: "line", x1: 50, y1: 62, x2: 50, y2: 94, width: 1.6 },
      { kind: "first", font: "serif", cx: 30, cy: 52, cap: 23, maxWidth: 28 },
      { kind: "second", font: "serif", cx: 70, cy: 52, cap: 23, maxWidth: 28 },
    ],
  },
};

/** Styles of a product in the order the product lists them; unknown ids are skipped. */
export function stylesFor(ids: ReadonlyArray<string>): MonogramStyle[] {
  return ids.filter((id): id is MonogramStyleId => id in MONOGRAM_STYLES).map((id) => MONOGRAM_STYLES[id]);
}
