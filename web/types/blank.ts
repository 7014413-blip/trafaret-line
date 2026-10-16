// Blanks configurator «/zahotovky» (ТЗ §4.7): the customer picks a shape, a size, a material
// with its thickness, a colour and a quantity. The price is the blank formula of
// lib/calculators/pricing.ts (cutting fee + sheet area × rate), the same one that prices the
// catalogue blank cards, and the server recomputes it from the design at checkout.

import type { LocalizedText, MaterialType, Shape } from "./customizer";

export type BlankShapeId =
  | "circle" | "square" | "rounded-square" | "rect" | "oval" | "heart"
  | "hexagon" | "star" | "cloud" | "arch" | "drop" | "wavy-circle";

/**
 * How the size is given: "diameter" — one number, the circle across; "side" — one number, the
 * larger side, priced by the square around the shape (as the catalogue cards); "box" — width × height.
 */
export type BlankSizeMode = "diameter" | "side" | "box";

export interface BlankShape {
  id: BlankShapeId;
  name: LocalizedText;
  sizeMode: BlankSizeMode;
  /** Shape for the weight of the piece (lib/calculators/geometry.ts shapeAreaM2). */
  sheetShape: Shape;
  /** Popular sizes, cm: one number, or width × height for "box". */
  presetsCm: ReadonlyArray<number | readonly [number, number]>;
  /** Height of the drawn shape to its width (scheme only; the price uses the square around it). */
  aspect: number;
}

export type BlankMaterialGroupId = "clear" | "coloured" | "mirror" | "board";

export type BlankColourId = "clear" | "black" | "milk" | "red" | "pink" | "blue" | "green" | "yellow" | "gold" | "silver" | "rose" | "white";

export interface BlankColour {
  id: BlankColourId;
  name: LocalizedText;
  /** Swatch and scheme colour. */
  hex: string;
  /** Second swatch colour for a mirror shine. */
  shine?: string;
}

/** One sheet on sale: a material of the knowledge base in one colour. */
export interface BlankSheetOption {
  group: BlankMaterialGroupId;
  materialId: MaterialType;
  colourId: BlankColourId;
}

export interface BlankMaterialGroup {
  id: BlankMaterialGroupId;
  name: LocalizedText;
  note: LocalizedText;
}

/** Size step of the configurator: a chip of the shape's presets or «Свій розмір» (preset null). */
export interface BlankSizeValue {
  preset: number | null;
  widthMm: number;
  heightMm: number;
}

/** What the customer chose; the server re-reads it field by field. */
export interface BlankDesign {
  shapeId: BlankShapeId;
  widthMm: number;
  heightMm: number;
  materialId: MaterialType;
  colourId: BlankColourId;
  quantity: number;
}

/** Unit price at one quantity of the wholesale scale. */
export interface BlankTierPrice {
  minQty: number;
  /** 0.05 = −5 %. */
  discount: number;
  unitPrice: number;
}

export interface BlankPrice {
  unitPrice: number;
  total: number;
  /** Discount applied at the chosen quantity, 0.05 = −5 %. */
  discount: number;
  /** Price of one pack (BLANK_PACK_QTY pieces) at the pack's own discount. */
  packQty: number;
  packPrice: number;
  /** 1 piece and every step of the scale, so the wholesale price is visible before ordering. */
  tiers: BlankTierPrice[];
}

/** The fields of a catalogue product (catalog/data/products.json) that blank repricing reads. */
export interface CatalogBlankProduct {
  handle: string;
  type: string;
  primary_category: string;
  hole?: unknown;
  min_price_uah?: number;
  options: { size?: { code: string; sheet_mm: [number, number]; pieces?: number }[] };
  variants: { sku: string; size: string; material: string; price_uah: number }[];
}

/** One catalogue variant whose price differs from the blank formula. */
export interface BlankRepriceChange {
  handle: string;
  sku: string;
  from: number;
  to: number;
}

/** Lowest price of a repriced catalogue product before and after, for its «від N ₴» texts. */
export interface BlankMinPriceChange {
  from: number;
  to: number;
}
