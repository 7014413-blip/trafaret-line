// Office wall plaque («Офісна табличка», Денис 2026-10-10): a black or white acrylic base
// with a mirror plate on top, the text engraved in the plate, 3M adhesive tape on the back.
// 21×6 cm costs 220 UAH; other sizes follow the area. Sizes in cm, prices in UAH only.

import type { LocalizedText } from "./customizer";
import type { PlaqueTextLine } from "./plaques";


export interface PlaqueBaseColour {
  id: string;                          // "black" | "white"
  name: LocalizedText;
  hex: string;
}

export interface PlaquePlateColour {
  id: string;                          // "gold" | "silver" | "bronze-gold" | "satin-silver"
  name: LocalizedText;
  /** Mirror tone and its highlight for the preview gradient. */
  hex: string;
  highlight: string;
  /** Satin plates are brushed, not glossy. */
  satin: boolean;
  /** Colour of the engraved letters (the layer under the mirror). */
  engraveHex: string;
}

export interface PlaqueSizePreset {
  code: string;                        // "21x6"
  widthMm: number;
  heightMm: number;
}


export interface OfficePlaqueDesign {
  /** Preset code or "custom". */
  sizeCode: string;
  widthMm: number;
  heightMm: number;
  baseColourId: string;
  plateColourId: string;
  lines: PlaqueTextLine[];
  quantity: number;
}

/** Admin settings; [default] values chosen by Claude on 2026-10-10. */
export interface OfficePlaqueConfig {
  /** Price of the reference size (Денис: 21×6 cm, 220 UAH). */
  referenceWidthMm: number;
  referenceHeightMm: number;
  referencePrice: number;
  /** Lowest price of one plaque. */
  minPrice: number;
  roundTo: number;
  presets: PlaqueSizePreset[];
  /** Base border around the plate, mm. */
  borderMm: number;
  /** Text margin inside the plate, mm. */
  plateMarginMm: number;
  minWidthMm: number;
  maxWidthMm: number;
  minHeightMm: number;
  maxHeightMm: number;
  maxLines: number;
  maxLineChars: number;
  /** Engraved letters lower than this are not made, mm. */
  absoluteMinLetterMm: number;
  /** Below this a manager checks the engraving, mm. */
  smallLetterMm: number;
}

export interface OfficePlaqueLinePlacement {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  capMm: number;
  scale: number;
}

export interface OfficePlaqueLayout {
  widthMm: number;
  heightMm: number;
  /** Mirror plate, origin at the plaque centre, mm. */
  plate: { x: number; y: number; width: number; height: number };
  lines: OfficePlaqueLinePlacement[];
}

export interface OfficePlaquePrice {
  unitPrice: number;
  total: number;
  quantity: number;
  /** Customer-facing: sizes in cm and UAH, never m². */
  lines: string[];
  internal: { areaCm2: number; basePrice: number; discountPercent: number; discountLabel: string };
}

export interface OfficePlaqueCheck {
  level: "error" | "warning";
  code: "empty" | "letters-too-small" | "letters-small" | "missing-glyphs";
  lineIndex?: number;
  message: LocalizedText;
}
