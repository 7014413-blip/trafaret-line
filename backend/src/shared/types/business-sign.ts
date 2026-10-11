// Business sign constructor (Денис 2026-10-10): a two-layer acrylic sign of any shape and size,
// base sheet plus a raised overlay of text lines, the customer's logo, an optional mirror frame
// and, on round signs, text along the edge. Price 17 000 UAH/m² of the overall box
// (lib/calculators/signage.ts), self-adhesive backing as an option. The design is turned into the
// common SignDesign (types/signage.ts), which the server re-prices.

import type { LocalizedText } from "./customizer";
import type { PlaqueTextLine } from "./plaques";
import type { SignShape } from "./signage";

/** Where the logo sits in the content area. */
export type BusinessSignLogoPlace = "above" | "left";

/** Logo picked by the customer: the file goes to the shop at checkout, a manager prepares the cut. */
export interface BusinessSignLogo {
  fileName: string;
  /** raster and pdf files are redrawn by a manager before cutting. */
  format: "svg" | "raster" | "pdf";
  /** Width / height of the picture. */
  aspect: number;
  /** Share of the content area the logo takes when there is text: 0.25 … 0.75. */
  share: number;
  place: BusinessSignLogoPlace;
  /** Light drawing on a dark background: the light parts are cut. */
  invert: boolean;
  /** Overlay sheet of the logo. */
  materialId: string;
}

/** Text along the edge of a round sign, as on seals and emblems. */
export interface BusinessSignArcText {
  top: string;
  bottom: string;
  fontId: string;
  materialId: string;
}

/** One text line with its own overlay sheet (a gold name over a black «SALON»). */
export interface BusinessSignLine extends PlaqueTextLine {
  materialId: string;
}

export interface BusinessSignDesign {
  shape: SignShape;
  widthMm: number;
  /** Equals widthMm for circle and square. */
  heightMm: number;
  /** Arrow and pointer: -1 points left, 1 points right. */
  direction: -1 | 1;
  baseMaterialId: string;
  baseThicknessMm: number;
  lines: BusinessSignLine[];
  logo: BusinessSignLogo | null;
  arc: BusinessSignArcText | null;
  /** Mirror frame along the edge; null = no frame. */
  frameMaterialId: string | null;
  holes: 0 | 2 | 4;
  selfAdhesive: boolean;
  positioningStencil: boolean;
  /** Our designer draws the logo (included in the price); the wishes go with the order. */
  logoDevelopment: boolean;
  logoBrief: string;
  quantity: number;
}

/** Ready sizes offered for a shape, mm. */
export interface BusinessSignSizePreset {
  widthMm: number;
  heightMm: number;
}

/** Admin settings of the constructor; [default] values chosen by Claude on 2026-10-10. */
export interface BusinessSignConfig {
  title: LocalizedText;
  presets: Record<SignShape, BusinessSignSizePreset[]>;
  minSideMm: number;
  maxSideMm: number;
  maxLines: number;
  maxLineChars: number;
  maxArcChars: number;
  /** Frame inset from the edge and its stroke, share of the shorter side (with minimums, mm). */
  frameInsetShare: number;
  frameInsetMinMm: number;
  frameWidthShare: number;
  frameWidthMinMm: number;
  /** Free space between the frame (or the edge) and the content, share of the shorter side. */
  paddingShare: number;
  /** Band of the edge text on round signs, share of the content radius. */
  arcBandShare: number;
  /** Largest angle the edge text may take, degrees. */
  arcMaxSpanDeg: number;
  /** Letter height of the edge text, share of the band. */
  arcCapShare: number;
  /** Gap between the logo and the text, share of the zone side. */
  logoGapShare: number;
  /** Minimum letter heights for this constructor, mm: mirror and other sheets. */
  minLetterMirrorMm: number;
  minLetterMm: number;
}

export interface BusinessSignZone { left: number; right: number; top: number; bottom: number }

/** One placed text line (mm, origin at the sign centre, Y down). */
export interface BusinessSignLinePlacement {
  index: number;
  /** Top-left corner of the line's text box. */
  x: number;
  y: number;
  width: number;
  height: number;
  capMm: number;
  /** Layout units → mm. */
  scale: number;
}

/** Edge text placed along the circle: path in mm around the sign centre. */
export interface BusinessSignArcPlacement {
  position: "top" | "bottom";
  pathData: string;
  capMm: number;
  missing: string[];
}

export interface BusinessSignLayout {
  widthMm: number;
  heightMm: number;
  /** Base outline, origin at the centre. */
  outline: [number, number][];
  frame:
    | { kind: "rect"; x: number; y: number; width: number; height: number; corner: number; stroke: number }
    | { kind: "circle"; r: number; stroke: number }
    | null;
  /** Thin ring between the edge text and the centre of a round sign. */
  innerRing: { r: number; stroke: number } | null;
  zone: BusinessSignZone;
  logo: { x: number; y: number; width: number; height: number } | null;
  lines: BusinessSignLinePlacement[];
  arcs: BusinessSignArcPlacement[];
  holes: { x: number; y: number }[];
}

/** Font measures of one edge text, independent of the sign size (layout units). */
export interface BusinessSignArcMeasure {
  text: string;
  capUnits: number;
  /** Every glyph: its advance and outline (baseline at y = 0, x from 0). */
  glyphs: { advance: number; contours: [number, number][][] }[];
  totalAdvance: number;
  missing: string[];
}
