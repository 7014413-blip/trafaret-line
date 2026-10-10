// Signs, pointers and acrylic letters (research/konstruktor-vyvesok.md).
// Approved by Денис 2026-10-08: sign = 17 000 UAH/m² of the overall bounding box (Денис 2026-10-10, was 18 000),
// two plastic layers (base 3 mm + overlay 1/2/3 mm), every colour and material included;
// a base thicker than 3 mm adds the blank-sheet price difference. m² never shown to customers.

import type { LocalizedText } from "./customizer";

export type SignShape = "circle" | "square" | "rect" | "rounded" | "arrow" | "pointer";
export type SignFinish = "mirror" | "gloss" | "matte" | "clear";
export type SignMode = "sign" | "letters";

/** One sheet in the acrylic palette (admin-editable). */
export interface AcrylicSheet {
  id: string;                          // 'mirror-silver', 'black', 'red', …
  name: LocalizedText;
  hex: string;                         // swatch colour; mirror uses a gradient in the UI
  finish: SignFinish;
  /** Thicknesses on sale, mm (blanks catalogue). */
  thicknessesMm: number[];
  inStock: boolean;                    // false = chip "під замовлення", longer lead time
  /** Minimum cap height of a cut letter, mm. */
  minLetterMm: number;
  /** Thinnest stroke the laser keeps in this sheet, mm. */
  minStrokeMm: number;
}

export interface SignBase {
  shape: SignShape;
  widthMm: number;
  heightMm: number;                    // = widthMm for circle and square
  /** -1 = points left, 1 = points right (arrow, pointer). */
  direction?: -1 | 1;
  materialId: string;
  thicknessMm: number;                 // 3 included; 6 / 8 add the sheet difference
}

export type SignLayerKind = "text" | "arcText" | "frame" | "logoColor";

export interface SignLayer {
  id: string;
  kind: SignLayerKind;
  materialId: string;
  thicknessMm: 1 | 2 | 3;              // included in the sign rate
  /** Offset of the layer centre from the base centre, mm. */
  x: number;
  y: number;
  text?: string;
  fontId?: string;
  capHeightMm?: number;
  arcPosition?: "top" | "bottom";
  frameWidthMm?: number;
  frameInsetMm?: number;
  /** logoColor: contours of one colour from the uploaded file, mm, already scaled. */
  svgPaths?: string[];
  sourceColor?: string;
  /** Uploaded raster traced automatically: a manager checks it before cutting. */
  traced?: boolean;
  /** Bounding box of the layer, mm, measured in the browser and re-measured on the server. */
  bbox?: { x: number; y: number; width: number; height: number };
}

export interface SignOptions {
  holes: 0 | 2 | 4;                    // Ø6, centre 20 mm from the edge
  selfAdhesive: boolean;               // double-sided tape on the back
  positioningStencil: boolean;         // carton / HDF template, laser layer 4
  whiteLabel: boolean;                 // no brand or prices in the parcel, agency as sender
}

export interface SignDesign {
  mode: SignMode;
  base: SignBase;                      // ignored in "letters" mode
  layers: SignLayer[];
  options: SignOptions;
  quantity: number;
}

/** Admin settings. Values marked [default] were set by Claude, approved in bulk by Денис 2026-10-08 23:45. */
export interface SignPricingConfig {
  signRatePerM2: number;               // 17 000 (Денис 2026-10-10)
  minSignPrice: number;                // 450 [default]
  minLettersPrice: number;             // 250 [default]
  lettersFactor: number;               // 1.5 × sheet rate for words [default]
  separateLettersFactor: number;       // 2.0 × sheet rate for loose letters [default]
  selfAdhesivePerM2: number;           // 600 [default]
  positioningStencilPerM2: number;     // 600 (Денис)
  whiteLabelPrice: number;             // 0 [default]
  includedBaseThicknessMm: number;     // 3 (Денис)
  /** Blank-sheet prices by thickness, UAH/m² (ТЗ «Материалы заготовок»). */
  sheetPricePerM2: { acrylic: Record<number, number>; mirror: Record<number, number> };
  holeDiameterMm: number;              // 6
  holeEdgeOffsetMm: number;            // 20
  edgeClearanceMm: number;             // 10, layer to base edge
  /** Laser bed, larger signs go to a manager ("під замовлення"). */
  maxSheetMm: { width: number; height: number };
  roundTo: number;                     // 10
}

export interface SignPriceLine {
  /** Customer-facing line: sizes in mm/cm and UAH only, never m². */
  label: string;
  amount: number;                      // UAH, 0 for informative lines
}

export interface SignPrice {
  unitPrice: number;
  total: number;
  quantity: number;
  lines: SignPriceLine[];
  /** For the admin panel and the server check only. */
  internal: { areaM2: number; ratePerM2: number; minApplied: boolean; discountPercent: number; discountLabel: string };
  /** Too large for the laser bed or a sheet not in stock: price shown, order goes to a manager. */
  needsManager: boolean;
}

export type SignCheckLevel = "error" | "warning";
export interface SignCheck {
  level: SignCheckLevel;
  code:
    | "letter-too-small" | "stroke-too-thin" | "too-close-to-edge" | "hole-on-layer"
    | "frame-on-holes" | "out-of-stock" | "traced-needs-review" | "too-large";
  layerId?: string;
  message: LocalizedText;
}
