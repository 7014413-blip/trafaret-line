// «Написи на планці» (joined words, Денис 2026-10-10): words cut from one layer of acrylic,
// the letters of every word standing on a thin strip under them, so the whole word is one
// piece (a coffee shop menu on his photos). The customer types the lines (a price or number
// next to a line is its own piece), picks fonts, colour and letter height. The price is
// 7000 UAH per m² of the made pieces (each piece by its outer box). Sizes in cm, prices in UAH.

import type { LocalizedText } from "./customizer";

/** One line of the menu: the words (one piece) and an optional price or number (a second piece). */
export interface JoinedWordsLine {
  text: string;
  /** Price or number cut as its own piece to the right of the words; "" when none. */
  tail: string;
  fontId: string;
  /** Relative letter size: 0.6 … 1.6 (1 = the chosen letter height). */
  size: number;
}

export interface JoinedWordsDesign {
  /** Acrylic sheet id (lib/joined-words/materials.ts). */
  materialId: string;
  /** Height of capital letters of a line with size 1, mm. */
  letterHeightMm: number;
  /** Capital letters only (like on Денис's photos). */
  upper: boolean;
  lines: JoinedWordsLine[];
  /** Number of identical sets. */
  quantity: number;
}

/** Admin settings; [default] values chosen by Claude on 2026-10-10. */
export interface JoinedWordsConfig {
  /** Денис 2026-10-10: 7000 UAH per m² of the product. */
  ratePerM2: number;
  /** Lowest price of one set. */
  minPrice: number;
  roundTo: number;
  minLetterMm: number;
  maxLetterMm: number;
  maxLines: number;
  maxLineChars: number;
  maxTailChars: number;
  /** Laser bed: a longer or taller piece cannot be cut in one go, mm. */
  maxPieceWidthMm: number;
  maxPieceHeightMm: number;
  /** Strip under the letters: share of the letter height, clamped to min / max mm. */
  barShare: number;
  barMinMm: number;
  barMaxMm: number;
  /** How far the strip reaches up into the letters, share of the strip height. */
  barOverlapShare: number;
  /** How far the strip sticks out past the first and last letter, share of the strip height. */
  barExtendShare: number;
  /** Gap between the words and their price, share of the letter height. */
  tailGapShare: number;
  /** Gap between the lines in the preview, share of the letter height. */
  rowGapShare: number;
}

export interface JoinedWordsMaterial {
  id: string;
  name: LocalizedText;
  hex: string;
  mirror: boolean;
  thicknessMm: number;
  /** Smallest letters this sheet is cut with, mm. */
  minLetterMm: number;
  inStock: boolean;
}

/** One piece measured in its font, in layout units (lib/text/text-layout.ts, font size 100). */
export interface JoinedPieceMeasure {
  widthUnits: number;
  heightUnits: number;
  capUnits: number;
  /** Distance from the top of the text box to the baseline. */
  baselineUnits: number;
}

/** Measures of one line: the words and the price; null when that part is empty. */
export interface JoinedLineMeasures {
  text: JoinedPieceMeasure | null;
  tail: JoinedPieceMeasure | null;
}

/** One cut piece placed in the preview, mm, origin at the top left of the whole set, Y down. */
export interface JoinedWordsPiece {
  lineIndex: number;
  part: "text" | "tail";
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
  capMm: number;
  /** Layout units → mm for the letters. */
  scale: number;
  /** Top left corner of the letters' box inside the set, mm. */
  textX: number;
  textY: number;
  /** The strip under the letters, mm, in set coordinates. */
  bar: { x: number; y: number; width: number; height: number };
}

export interface JoinedWordsLayout {
  /** Box of the whole set as it is hung, mm. */
  widthMm: number;
  heightMm: number;
  pieces: JoinedWordsPiece[];
}

export interface JoinedWordsPrice {
  unitPrice: number;
  total: number;
  quantity: number;
  /** Customer-facing: pieces, sizes in cm and UAH, never m². */
  lines: string[];
  internal: { areaCm2: number; basePrice: number; pieces: number; discountPercent: number; discountLabel: string };
}

export interface JoinedWordsCheck {
  level: "error" | "warning";
  code: "empty" | "letters-too-small" | "letters-too-large" | "piece-too-long" | "missing-glyphs" | "loose-parts";
  lineIndex?: number;
  message: LocalizedText;
}
