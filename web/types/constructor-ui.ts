// Shared building blocks of the site constructors (signs, plaques, letters): colour swatches,
// size presets, design checks, the price panel and the state of the «В кошик» button.

import type { LocalizedText } from "./customizer";

/** One colour a swatch row offers. Mirror sheets are drawn with a light gradient. */
export interface SwatchSheet {
  id: string;
  name: LocalizedText;
  hex: string;
  inStock: boolean;
  /** Mirror sheet (constructor palettes). */
  mirror?: boolean;
  /** Finish of a sign palette sheet: "mirror" draws the gradient. */
  finish?: string;
}

/** Fixed size of a plaque constructor; its price comes from the constructor. */
export interface SizePresetOption {
  code: string;
  widthMm: number;
  heightMm: number;
}

/** Limits of a custom plaque size, mm. */
export interface SizeLimits {
  minWidthMm: number;
  maxWidthMm: number;
  minHeightMm: number;
  maxHeightMm: number;
}

/** Custom size typed by the customer, in centimetres as typed. */
export interface CustomSizeCm {
  w: number;
  h: number;
}

/** Size chosen in a plaque constructor: a preset code or "custom" with the clamped size. */
export interface PresetSizeState {
  sizeCode: string;
  setSizeCode: (code: string) => void;
  customCm: CustomSizeCm;
  setCustomCm: (next: CustomSizeCm | ((current: CustomSizeCm) => CustomSizeCm)) => void;
  size: { widthMm: number; heightMm: number };
}

/** A note or error about a design, shown above the price. */
export interface DesignCheckMessage {
  level: "error" | "warning";
  message: LocalizedText;
}

/** One row of the price breakdown; an amount above zero is shown as a surcharge. */
export interface PriceBreakdownLine {
  label: string;
  amount?: number;
}

/** State of the «В кошик» button: uploading a logo first, or just added. */
export type BuyState = "idle" | "uploading" | "added" | "error";

/** The customer's logo of a constructor as picked in the browser, before and after upload. */
export interface UploadableLogo {
  file: File;
  previewUrl: string;
  /** Storage key once uploaded; null until then. */
  uploadKey: string | null;
}

/** Outcome of uploading a constructor logo before the design goes to the cart. */
export type LogoUploadResult = { ok: true; uploadKey: string | null } | { ok: false };

/** A text line placed in a constructor layout: its outline is translated and scaled into place. */
export interface PlacedLine {
  index: number;
  x: number;
  y: number;
  scale: number;
}
