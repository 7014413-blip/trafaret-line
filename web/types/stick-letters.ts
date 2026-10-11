// Self-adhesive acrylic letters (Денис 2026-10-10): words like «Gifts and Cards» or «Reserved»
// cut from 3 mm acrylic with tape on the back, for card boxes, wedding gifts and postcards.
// Every line has its own font and size; letters that touch in the font (a script «and») can stay
// one piece, or every letter is cut on its own. A cardboard stencil to glue the letters straight
// comes with every set. Price 7000 UAH per m² of the cut pieces (each piece by its outer box).
// Sizes in cm, prices in UAH.

import type { LocalizedText } from "./customizer";

export interface StickLettersLine {
  text: string;
  fontId: string;
  /** Relative letter size: 0.4 … 1.6 (1 = the chosen letter height). */
  size: number;
  /** Letters that touch in the font stay one piece (a script word); false = every letter apart. */
  joined: boolean;
}

export interface StickLettersDesign {
  /** Acrylic sheet id (lib/joined-words/materials.ts palette). */
  materialId: string;
  /** Height of capital letters of a line with size 1, mm. */
  letterHeightMm: number;
  upper: boolean;
  lines: StickLettersLine[];
  /** Identical sets. */
  quantity: number;
}

/** Admin settings; [default] values chosen by Claude on 2026-10-10. */
export interface StickLettersConfig {
  /** Денис 2026-10-10: 7000 UAH per m², acrylic 3 mm. */
  ratePerM2: number;
  minPrice: number;
  roundTo: number;
  thicknessMm: number;
  minLetterMm: number;
  maxLetterMm: number;
  maxLines: number;
  maxLineChars: number;
  /** Gap between the lines, share of the letter height. */
  rowGapShare: number;
  /** Glyph boxes closer than this (share of the letter height) count as touching. */
  touchShare: number;
  /** Cardboard stencil: margin around the letters, mm. */
  stencilMarginMm: number;
  /** Laser bed for one piece, mm. */
  maxPieceWidthMm: number;
  maxPieceHeightMm: number;
}

/** Glyph box of a line in layout units (font size 100), box of the line starting at (0, 0). */
export interface StickGlyphBox {
  char: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** One line measured in its font. */
export interface StickLineMeasure {
  widthUnits: number;
  heightUnits: number;
  capUnits: number;
  glyphs: StickGlyphBox[];
}

/** One placed line, mm, origin at the top left of the set, Y down. */
export interface StickLinePlacement {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  capMm: number;
  /** Layout units → mm. */
  scale: number;
  /** Letters of this line with a joined line still cut apart (the font's letters do not touch). */
  apart: boolean;
}

/** One cut piece, mm, set coordinates. */
export interface StickLettersPiece {
  lineIndex: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StickLettersLayout {
  widthMm: number;
  heightMm: number;
  lines: StickLinePlacement[];
  pieces: StickLettersPiece[];
  /** Cardboard stencil around the set. */
  stencil: { x: number; y: number; width: number; height: number };
}

export interface StickLettersPrice {
  unitPrice: number;
  total: number;
  quantity: number;
  /** Customer-facing: pieces, sizes in cm and UAH, never m². */
  lines: string[];
  internal: { areaCm2: number; basePrice: number; pieces: number; discountPercent: number; discountLabel: string };
}

export interface StickLettersCheck {
  level: "error" | "warning";
  code: "empty" | "letters-too-small" | "letters-too-large" | "piece-too-long" | "missing-glyphs" | "not-joined";
  lineIndex?: number;
  message: LocalizedText;
}
