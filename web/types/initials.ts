// Wedding cake initials («S | D», Денис 2026-10-10): two letters and a separator cut from
// mirror (or plain) acrylic, laid on the cake as separate pieces or joined on a strip with a
// skewer as one topper. 8200 UAH per m² of the whole composition's box. Sizes in cm, UAH only.

import type { LocalizedText } from "./customizer";

export type InitialsSeparator = "bar" | "amp" | "plus" | "dot" | "none";

/** pieces: every letter and the separator are separate pieces; topper: one piece on a strip with a skewer. */
export type InitialsMode = "pieces" | "topper";

export interface InitialsDesign {
  first: string;
  second: string;
  separator: InitialsSeparator;
  fontId: string;
  /** Height of the capital letters, mm. */
  letterHeightMm: number;
  /** Acrylic sheet id (lib/joined-words/materials.ts palette). */
  materialId: string;
  mode: InitialsMode;
  quantity: number;
}

/** Admin settings; [default] values chosen by Claude on 2026-10-10. */
export interface InitialsConfig {
  /** Денис 2026-10-10: 8200 UAH per m². */
  ratePerM2: number;
  minPrice: number;
  roundTo: number;
  minLetterMm: number;
  maxLetterMm: number;
  maxChars: number;
  /** Gap between a letter and the separator, share of the letter height. */
  gapShare: number;
  /** Separator bar: width and height, share of the letter height. */
  barWidthShare: number;
  barMinWidthMm: number;
  barHeightShare: number;
  /** Topper: strip under the letters (share of the letter height, min mm) and the skewer. */
  stripShare: number;
  stripMinMm: number;
  skewerWidthShare: number;
  skewerMinWidthMm: number;
  skewerLengthShare: number;
}

/** One shape of the composition, mm, origin at the top left of its box, Y down. */
export type InitialsShape =
  | { type: "text"; key: "first" | "second" | "sep"; x: number; y: number; scale: number }
  | { type: "rect"; x: number; y: number; width: number; height: number }
  | { type: "circle"; cx: number; cy: number; r: number }
  | { type: "poly"; points: [number, number][] };

export interface InitialsLayout {
  widthMm: number;
  heightMm: number;
  shapes: InitialsShape[];
  /** Separate pieces to cut. */
  pieces: number;
}

export interface InitialsPrice {
  unitPrice: number;
  total: number;
  quantity: number;
  /** Customer-facing: sizes in cm and UAH, never m². */
  lines: string[];
  internal: { areaCm2: number; basePrice: number; discountPercent: number; discountLabel: string };
}

export interface InitialsCheck {
  level: "error" | "warning";
  code: "empty" | "missing-glyphs" | "loose-parts" | "letters-too-small";
  message: LocalizedText;
}
