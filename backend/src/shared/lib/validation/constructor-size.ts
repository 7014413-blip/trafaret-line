// Server-side size of constructor orders (QA finding 2026-10-10: a large stencil was
// accepted at the price of a small one because the sheet size came from the browser).
// The server rebuilds the layout from the text, font and options in the order line spec
// with the same code as the storefront (lib/text, lib/geometry) and returns the size it
// will produce and charge for. The browser's numbers are only compared, never trusted.

import type { TextAlign, WeldOptions } from "../../types/geometry";
import { sheetForDesign } from "../calculators/geometry";
import { DEFAULT_WELD } from "../geometry/weld";
import { weldAtWidth } from "../geometry/weld-sizing";
import { textToDesign } from "../text/text-layout";
import { loadFontById } from "../text/node-fonts";
import type { LoadedFont } from "../../types/text";

/** Largest difference between the browser's and the server's size that is accepted, mm. */
export const SIZE_TOLERANCE_MM = 3;

export interface TextSpec {
  text: string;
  fontId: string;
  /** Font of each line; empty entries use fontId (customer fonts are "custom:<key>"). */
  lineFontIds: string[];
  align: TextAlign;
  upper: boolean;
}

export class SpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpecError";
  }
}

const ALIGNS: TextAlign[] = ["left", "center", "right"];

/** Reads and validates the text part of a constructor spec. */
export function readTextSpec(spec: Record<string, unknown> | null | undefined): TextSpec {
  if (!spec) throw new SpecError("spec missing");
  const text = typeof spec.text === "string" ? spec.text : "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length || text.length > 200 || lines.length > 4) throw new SpecError("bad text");
  const fontId = typeof spec.fontId === "string" ? spec.fontId : "";
  const align = ALIGNS.includes(spec.align as TextAlign) ? (spec.align as TextAlign) : "center";
  const lineFontIds = Array.isArray(spec.lineFontIds)
    ? spec.lineFontIds.slice(0, 4).map((id) => (typeof id === "string" ? id : ""))
    : [];
  return { text, fontId, lineFontIds, align, upper: spec.upper === true };
}

/** Main font and per-line fonts of the spec; unknown fonts reject the order line. */
function fontsOf(spec: TextSpec): { font: LoadedFont; lineFonts: (LoadedFont | null)[] } {
  const font = loadFontById(spec.fontId);
  if (!font) throw new SpecError(`unknown font ${spec.fontId}`);
  const lineFonts = spec.lineFontIds.map((id) => {
    if (!id) return null;
    const lineFont = loadFontById(id);
    if (!lineFont) throw new SpecError(`unknown font ${id}`);
    return lineFont;
  });
  return { font, lineFonts };
}

/** Sheet height of a «Свій напис» stencil for the paid width, mm. */
export function stencilHeightMm(spec: TextSpec, widthMm: number, marginMm: number): number {
  const { font, lineFonts } = fontsOf(spec);
  const layout = textToDesign(font, spec.text, { align: spec.align, upper: spec.upper, lineFonts });
  if (layout.missing.length) throw new SpecError("font has no glyphs for some characters");
  return sheetForDesign(layout.design, widthMm, marginMm).heightMm;
}

/** Merges stored weld options with the defaults (unknown or malformed fields fall back). */
export function readWeldOptions(raw: unknown): WeldOptions {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<WeldOptions>;
  const num = (v: unknown, fallback: number, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);
  return {
    overlapShare: num(o.overlapShare, DEFAULT_WELD.overlapShare, 0, 0.2),
    connectorMm: num(o.connectorMm, DEFAULT_WELD.connectorMm, 1, 20),
    baseline: {
      enabled: o.baseline?.enabled === true,
      heightMm: num(o.baseline?.heightMm, DEFAULT_WELD.baseline.heightMm, 1, 50),
      overlapMm: num(o.baseline?.overlapMm, DEFAULT_WELD.baseline.overlapMm, 0, 20),
      extendMm: num(o.baseline?.extendMm, DEFAULT_WELD.baseline.extendMm, 0, 50),
    },
    outline: {
      enabled: o.outline?.enabled === true,
      offsetMm: num(o.outline?.offsetMm, DEFAULT_WELD.outline.offsetMm, 0, 30),
    },
    skewers: {
      count: o.skewers?.count === 1 || o.skewers?.count === 2 ? o.skewers.count : 0,
      widthMm: num(o.skewers?.widthMm, DEFAULT_WELD.skewers.widthMm, 2, 20),
      lengthMm: num(o.skewers?.lengthMm, DEFAULT_WELD.skewers.lengthMm, 0, 300),
      pointed: o.skewers?.pointed !== false,
    },
  };
}

/** Size of a welded word made at the paid width, mm, and whether it is one piece. */
export function weldedSizeMm(spec: TextSpec, widthMm: number, options: WeldOptions): { widthMm: number; heightMm: number; pieces: number } {
  const { font, lineFonts } = fontsOf(spec);
  const layout = textToDesign(font, spec.text, { align: spec.align, upper: spec.upper, lineFonts });
  if (layout.missing.length) throw new SpecError("font has no glyphs for some characters");
  const sized = weldAtWidth(layout.glyphs, layout.capUnits, widthMm, spec.align, options);
  if (!sized) throw new SpecError("empty word");
  return { widthMm: sized.result.bbox.maxX, heightMm: sized.result.bbox.maxY, pieces: sized.result.pieces };
}
