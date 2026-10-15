// Wedding monogram stencils (Денис, 2026-10-10): the buyer types two initials (and a date
// for some designs), picks one of the product's designs and sees the real cut with bridges.
// Designs are drawn in a 100 × 100 unit box, y grows down; the builder scales the box into
// the sheet with a margin and turns every element into contours in millimetres.

import type { Polygon } from "./geometry";

/** Every monogram design of the site; a product lists the ones it offers. */
export type MonogramStyleId =
  | "vine-date"
  | "wreath-date"
  | "script-date"
  | "diagonal-classic"
  | "diagonal-arc"
  | "sprig-line"
  | "heart-line";

/** Font roles: the actual files live in public/fonts/monogram-manifest.json (MONOGRAM_FONTS). */
export type MonogramFontRole = "serif" | "italic" | "script" | "date";

/** What the buyer types. Initials are one letter each; the date is free text up to 12 characters. */
export interface MonogramInput {
  first: string;
  second: string;
  date: string;
}

export type MonogramField = keyof MonogramInput;

export interface MonogramText {
  uk: string;
  ru: string;
}

/** A letter, the ampersand or the date, placed by the middle of its capital height. */
export interface MonogramGlyphElement {
  kind: "first" | "second" | "amp" | "date";
  font: MonogramFontRole;
  /** Centre of the text box, units. */
  cx: number;
  cy: number;
  /** Capital height, units. */
  cap: number;
  /** Widest the text may get, units; longer text is made smaller. */
  maxWidth: number;
  /**
   * The ampersand lies on top of the letters: where it crosses them, the letters are cut
   * back by a strip of sheet as wide as a bridge (lib/monogram/knockout.ts).
   */
  overLetters?: boolean;
}

/** Open ring segment. Angles in degrees, 0 = right, 90 = down (y grows down). */
export interface MonogramArcElement {
  kind: "arc";
  cx: number;
  cy: number;
  r: number;
  from: number;
  to: number;
  /** Stroke width, units. */
  width: number;
}

/** Leaves along a stem. The stem is a circle segment (bent branch) or a straight line (sprig). */
export interface MonogramBranchElement {
  kind: "branch";
  path:
    | { type: "arc"; cx: number; cy: number; r: number; from: number; to: number }
    | { type: "line"; x1: number; y1: number; x2: number; y2: number };
  /** Stem width, units. */
  width: number;
  leafLength: number;
  leafWidth: number;
  /** Distance between leaves along the stem, units. */
  leafStep: number;
  /** Angle between a leaf and the stem, degrees. */
  leafAngle: number;
  /** Stem length before the first leaf, units. */
  bareStart: number;
  /** "both": leaves alternate on both sides; "pairs": two leaves at every step. */
  layout: "both" | "pairs";
}

export interface MonogramHeartElement {
  kind: "heart";
  cx: number;
  cy: number;
  /** Width of the heart, units. */
  size: number;
}

/** Straight stroke with square ends. */
export interface MonogramLineElement {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

export type MonogramElement =
  | MonogramGlyphElement
  | MonogramArcElement
  | MonogramBranchElement
  | MonogramHeartElement
  | MonogramLineElement;

export interface MonogramStyle {
  id: MonogramStyleId;
  name: MonogramText;
  /** Fields the buyer fills in for this design. */
  fields: MonogramField[];
  /** Example the design is shown with before the buyer types anything. */
  sample: MonogramInput;
  elements: MonogramElement[];
}

/** Product-level settings in Medusa metadata (`monogram`). */
export interface MonogramProductConfig {
  /** Designs offered on the product page, the first one is the default. */
  styles: MonogramStyleId[];
}

/** Contours of one monogram on a sheet, ready for buildStencilCut. */
export interface MonogramDesign {
  /** One group per letter, digit or ornament piece, mm. */
  groups: Polygon[][];
  /** Capital height of the initials, mm (sets the bridge width). */
  capMm: number;
  /** Capital height of the date, mm; null for designs without a date. */
  dateCapMm: number | null;
  /** Bridge width for this size, mm. */
  bridgeWidthMm: number;
  /** Characters the design font does not have. */
  missing: string[];
}

/** Result of checking what the buyer typed. */
export interface MonogramInputCheck {
  value: MonogramInput;
  /** Ukrainian messages per field; empty when everything is fine. */
  errors: Partial<Record<MonogramField, string>>;
}
