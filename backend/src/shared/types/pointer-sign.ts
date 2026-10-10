// Two-layer raised pointer signs («Табличка-вказівник», Денис 2026-10-10): a pointer-shaped
// base with a cut overlay of text, a direction arrow and an optional logo. Fixed sizes have
// Денис's per-piece prices; a custom size is priced by the sign rate with a minimum.
// Every colour and material is included in the price. The customer sees sizes in cm and UAH only.

import type { LocalizedText } from "./customizer";
import type { PlaqueLineMeasure, PlaqueTextLine } from "./plaques";

/** -1 = the tip points left, 1 = the tip points right. */
export type PointerDirection = -1 | 1;

export type PointerMaterialGroup = "acrylic" | "mirror" | "polystyrene";

/** One sheet a pointer sign layer can be cut from. */
export interface PointerMaterial {
  /** Palette id: the acrylic ids of the sign palette, "ps-…" for polystyrene. */
  id: string;
  group: PointerMaterialGroup;
  name: LocalizedText;
  /** Swatch and preview colour; mirror sheets get a gradient in the preview. */
  hex: string;
  mirror: boolean;
  /** Thickness when the sheet is the base, mm. */
  baseThicknessMm: number;
  /** Thickness when the sheet is the raised overlay, mm. */
  overlayThicknessMm: number;
  /** Smallest cap height that is cut cleanly from this sheet, mm. */
  minLetterMm: number;
  /** false = «під замовлення»: the price stays, a manager confirms the lead time. */
  inStock: boolean;
}

/** Fixed size with its own per-piece price (Денис). */
export interface PointerSizePreset {
  code: string;                        // "25x10"
  widthMm: number;
  heightMm: number;
  price: number;                       // UAH per piece before the quantity discount
}

/** Where the small direction arrow sits on its text line. */
export type PointerArrowPlacement = "none" | "start" | "end";

export type PointerTextLine = PlaqueTextLine;

export interface PointerLogo {
  /** Customer file key from POST /store/tl-upload, set when the line goes to the cart. */
  uploadKey: string | null;
  fileName: string;
  /** svg = cut as drawn; raster = traced, a manager checks the outline before cutting. */
  format: "svg" | "raster";
  /** Width / height of the picture. */
  aspect: number;
  /** Light picture on a dark or transparent background: the light parts become the overlay. */
  invert: boolean;
  /** Thin ring around the logo from the overlay sheet. */
  ring: boolean;
}

export interface PointerSignDesign {
  /** Preset code or "custom". */
  sizeCode: string;
  widthMm: number;
  heightMm: number;
  direction: PointerDirection;
  baseMaterialId: string;
  overlayMaterialId: string;
  lines: PointerTextLine[];
  arrow: { placement: PointerArrowPlacement; lineIndex: number };
  logo: PointerLogo | null;
  quantity: number;
}

/** Admin settings; values marked [default] were chosen by Claude on 2026-10-10. */
export interface PointerSignConfig {
  presets: PointerSizePreset[];
  /** Custom sizes: overall bounding box × this rate, UAH/m² (the approved sign rate). */
  customRatePerM2: number;
  /** Lowest price of one sign of any size. */
  minPrice: number;
  roundTo: number;
  minWidthMm: number;
  maxWidthMm: number;
  minHeightMm: number;
  maxHeightMm: number;
  /** Height may not exceed this share of the width, so the sign stays a pointer. */
  maxHeightToWidth: number;
  maxLines: number;
  maxLineChars: number;
  /** Below this cap height the letters are not cut at all, mm. */
  absoluteMinLetterMm: number;
}

/** One measured text line, in layout units of lib/text/text-layout.ts (font size 100). */
export type PointerLineMeasure = PlaqueLineMeasure;

/** Position of one text line on the sign, mm, origin at the sign centre, Y down. */
export interface PointerLinePlacement {
  index: number;
  /** Top-left corner of the text bounding box. */
  x: number;
  y: number;
  width: number;
  height: number;
  capMm: number;
  /** Layout units → mm. */
  scale: number;
}

export interface PointerArrowPlacementBox {
  /** Closed outline of the arrow, mm. */
  points: [number, number][];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PointerLogoPlacement {
  /** Centre of the logo area, mm. */
  cx: number;
  cy: number;
  /** Box the picture is fitted into, mm. */
  boxWidth: number;
  boxHeight: number;
  /** Ring centre line radius and stroke width, mm (0 = no ring). */
  ringRadius: number;
  ringWidth: number;
}

export interface PointerSignLayout {
  widthMm: number;
  heightMm: number;
  /** Base outline, centre origin, mm. */
  outline: [number, number][];
  /** Area the text block may use, mm. */
  textZone: { x: number; y: number; width: number; height: number };
  lines: PointerLinePlacement[];
  arrow: PointerArrowPlacementBox | null;
  logo: PointerLogoPlacement | null;
  /** Margin kept from the base edge, mm. */
  marginMm: number;
}

export interface PointerPriceLine {
  /** Customer-facing: sizes in cm and UAH, never m². */
  label: string;
  amount: number;
}

export interface PointerSignPrice {
  unitPrice: number;
  total: number;
  quantity: number;
  lines: PointerPriceLine[];
  /** A sheet is made to order: price shown, a manager confirms the lead time. */
  needsManager: boolean;
  /** Admin panel and server check only. */
  internal: { areaM2: number; preset: string | null; basePrice: number; discountPercent: number; discountLabel: string };
}

export type PointerCheckCode =
  | "empty" | "letters-too-small" | "letters-small" | "missing-glyphs" | "out-of-stock" | "raster-logo" | "same-colour";

export interface PointerSignCheck {
  level: "error" | "warning";
  code: PointerCheckCode;
  lineIndex?: number;
  message: LocalizedText;
}
