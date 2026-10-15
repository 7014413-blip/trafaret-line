// Two-layer acrylic plaques with fixed sizes (Денис 2026-10-10), one module for three products:
// floor: «ПОВЕРХ 1» signs for apartment buildings, mirror text and frame on a white or black base
//   (13×18 cm 360, 15×20 cm 480, 25×20 cm 850 UAH);
// door: long door signs with rounded corners, mirror edging and raised mirror letters
//   (sizes and prices are Claude's defaults until Денис confirms);
// number: room / apartment numbers, a front plate over an offset back plate, the number cut
//   through the front so the back colour shows (8×8 cm 65, 10×10 cm 110, 15×15 cm 160 UAH).
// A series (floors 1…9, flats 1…120) is ordered at once: every number is its own plaque.
// Sizes in cm, prices in UAH only.

import type { LocalizedText } from "./customizer";
import type { PlaqueTextLine } from "./plaques";
import type { PointerMaterial } from "./pointer-sign";

export type LayeredPlaqueKind = "floor" | "door" | "number";

/** Sheets of these plaques: the pointer sign palette plus light bases for door signs. */
export type LayeredPlaqueMaterial = PointerMaterial;

export interface LayeredPlaquePreset {
  code: string;                        // "13x18"
  widthMm: number;
  heightMm: number;
  /** UAH per plaque before the quantity discount. */
  price: number;
}

export interface LayeredPlaqueSeries {
  from: number;
  to: number;
}

export interface LayeredPlaqueDesign {
  kind: LayeredPlaqueKind;
  /** Preset code or "custom". */
  sizeCode: string;
  widthMm: number;
  heightMm: number;
  /** floor / door: the plate; number: the front plate. */
  baseMaterialId: string;
  /** floor / door: the raised text and frame; number: the back plate seen through the number. */
  overlayMaterialId: string;
  /** Mirror frame (floor) or edging (door) along the outline. */
  frame: boolean;
  lines: PlaqueTextLine[];
  /** Numbers 1…N on the series line, one plaque each; null = one design. */
  series: LayeredPlaqueSeries | null;
  /** Copies of the whole set. */
  quantity: number;
}

/** Admin settings of one product; [default] values chosen by Claude on 2026-10-10. */
export interface LayeredPlaqueConfig {
  kind: LayeredPlaqueKind;
  title: LocalizedText;
  presets: LayeredPlaquePreset[];
  /**
   * Custom sizes: by area at this rate (UAH per cm²) with the minimum; when null, by the
   * preset prices (linear by area between them, the largest preset's rate above it).
   */
  customRatePerCm2: number | null;
  minPrice: number;
  roundTo: number;
  minWidthMm: number;
  maxWidthMm: number;
  minHeightMm: number;
  maxHeightMm: number;
  /** Corner radius, share of the shorter side. */
  cornerShare: number;
  /** Frame: inset from the edge and stroke width, share of the shorter side (min mm). */
  frameInsetShare: number;
  frameWidthShare: number;
  frameMinWidthMm: number;
  /** number: offset of the back plate, share of the shorter side. */
  backOffsetShare: number;
  maxLines: number;
  maxLineChars: number;
  /** Line that takes the numbers of a series; null = no series. */
  seriesLine: number | null;
  maxSeries: number;
  minLetterMm: number;
  defaultLines: PlaqueTextLine[];
  defaultBaseId: string;
  defaultOverlayId: string;
  defaultFrame: boolean;
  /** Base colours offered first (the rest of the palette follows). */
  baseIds: string[];
  overlayIds: string[];
}

export interface LayeredPlaqueLinePlacement {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  capMm: number;
  scale: number;
}

export interface LayeredPlaqueLayout {
  widthMm: number;
  heightMm: number;
  cornerMm: number;
  /** Front plate (origin at the plate centre, mm). */
  plate: { x: number; y: number; width: number; height: number };
  /** number: the back plate, offset down and right; null otherwise. */
  back: { x: number; y: number; width: number; height: number } | null;
  /** Frame stroke centre line and width; null = no frame. */
  frame: { x: number; y: number; width: number; height: number; corner: number; stroke: number } | null;
  lines: LayeredPlaqueLinePlacement[];
}

export interface LayeredPlaquePrice {
  /** Price of one set (every number of the series once). */
  unitPrice: number;
  total: number;
  quantity: number;
  /** Plaques in one set. */
  count: number;
  /** One plaque after the discount. */
  piecePrice: number;
  /** Customer-facing: sizes in cm and UAH, never m². */
  lines: string[];
  internal: { basePrice: number; discountPercent: number; discountLabel: string };
}

export interface LayeredPlaqueCheck {
  level: "error" | "warning";
  code: "empty" | "letters-too-small" | "missing-glyphs" | "series";
  lineIndex?: number;
  message: LocalizedText;
}
