// Self-adhesive acrylic letters (Денис 2026-10-10): words like «Gifts and Cards» or «Reserved»
// cut from 3 mm acrylic with tape on the back, for card boxes, wedding gifts and postcards.
// Every line has its own font and size; letters that touch in the font (a script «and») can stay
// one piece, or every letter is cut on its own. A cardboard stencil to glue the letters straight
// comes with every set. Price 7000 UAH per m² of the cut pieces (each piece by its outer box).
// Sizes in cm, prices in UAH.

import type { LocalizedText } from "./customizer";

/**
 * letters: words for card boxes, adhesive and a cardboard stencil included (7000 UAH/m²);
 * chars: single acrylic numbers and letters 2–80 cm (Денис 2026-10-11): 7500 UAH/m² with
 * self-adhesive, 6500 UAH/m² without, every character its own piece;
 * sign-letters: separate self-adhesive capital and small letters 2–20 cm for ads, inscriptions and
 * signs (Денис 2026-10-11): black or white 6500 UAH/m², mirror silver, rose gold, gold 10 200 UAH/m².
 */
export type StickLettersProduct = "letters" | "chars" | "sign-letters";

export interface StickLettersLine {
  text: string;
  fontId: string;
  /** Relative letter size: 0.4 … 1.6 (1 = the chosen letter height). */
  size: number;
  /** Letters that touch in the font stay one piece (a script word); false = every letter apart. */
  joined: boolean;
}

export interface StickLettersDesign {
  product: StickLettersProduct;
  /** Double-sided tape on the back (always on for "letters"). */
  adhesive: boolean;
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
  product: StickLettersProduct;
  title: LocalizedText;
  /** UAH per m² with self-adhesive (letters: 7000, chars: 7500, Денис). */
  ratePerM2: number;
  /** UAH per m² without self-adhesive; null = always with it (chars: 6500, Денис). */
  rateNoAdhesivePerM2: number | null;
  /** UAH per m² by sheet id; replaces ratePerM2 for the sheets listed (sign-letters, Денис). */
  materialRates: Record<string, number> | null;
  /** Sheets offered, in this order; null = the whole palette. */
  materialIds: string[] | null;
  /** The customer may switch all letters to capitals. */
  caseChoice: boolean;
  /** A cardboard stencil for gluing comes with the set. */
  stencil: boolean;
  /** Letters may be joined into one piece; false = every character apart. */
  joinable: boolean;
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

/** Price of identical pieces (same character, same size), for the per-piece list the customer sees. */
export interface StickPiecePrice {
  text: string;
  widthMm: number;
  heightMm: number;
  /** How many such pieces are in one set. */
  count: number;
  /** One piece: its outer box × the rate, whole UAH. */
  price: number;
}
