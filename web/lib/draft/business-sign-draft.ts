// Reads a business sign draft from an address with the limits of the constructor
// (lib/business-sign/config.ts); anything wrong makes the whole draft null.

import { DEFAULT_BUSINESS_SIGN_CONFIG } from "../business-sign/config";
import { BUSINESS_SIGN_PALETTE } from "../business-sign/palette";
import { createDesignReader, FONT_ID_PATTERN } from "../validation/design-reader";
import { oneOf } from "./one-of";
import type { BusinessSignDraft } from "../../types/draft";
import type { SignShape } from "../../types/signage";

const read = createDesignReader("business sign draft");
const CFG = DEFAULT_BUSINESS_SIGN_CONFIG;
const SHAPES: SignShape[] = ["circle", "square", "rect", "rounded", "arrow", "pointer"];
const THICKNESSES = [2, 3, 6, 8];
const MAX_BRIEF_CHARS = 500;

const side = (value: unknown, what: string) => Math.max(CFG.minSideMm, Math.min(CFG.maxSideMm, Math.round(read.num(value, what))));

function sheetId(value: unknown): string {
  const id = String(value ?? "");
  if (!BUSINESS_SIGN_PALETTE.some((sheet) => sheet.id === id)) read.fail("bad sheet");
  return id;
}

export function parseBusinessSignDraft(raw: unknown): BusinessSignDraft | null {
  try {
    const d = read.record(raw, "draft");
    const lines = read.list(d.lines, CFG.maxLines, "lines").map((value) => ({
      ...read.textLine(value, { maxChars: CFG.maxLineChars, fontId: FONT_ID_PATTERN, minSize: 0.6, maxSize: 1.6 }),
      materialId: sheetId(read.record(value, "line").materialId),
    }));
    if (!lines.length) read.fail("no lines");
    const arcRaw = d.arc == null ? null : read.record(d.arc, "arc");
    const arcText = (value: unknown) => {
      const text = read.clean(value);
      if ([...text].length > CFG.maxArcChars) read.fail("edge text is too long");
      return text;
    };
    const arcFont = arcRaw ? String(arcRaw.fontId ?? "") : "";
    if (arcRaw && !FONT_ID_PATTERN.test(arcFont)) read.fail("bad edge font");
    const brief = String(d.logoBrief ?? "");
    if ([...brief].length > MAX_BRIEF_CHARS) read.fail("brief is too long");
    return {
      shape: oneOf(read, d.shape, SHAPES, "shape"),
      widthMm: side(d.widthMm, "width"),
      heightMm: side(d.heightMm, "height"),
      direction: oneOf(read, d.direction, [-1, 1] as const, "direction"),
      baseMaterialId: sheetId(d.baseMaterialId),
      baseThicknessMm: oneOf(read, d.baseThicknessMm, THICKNESSES, "thickness"),
      lines,
      arc: arcRaw ? { top: arcText(arcRaw.top), bottom: arcText(arcRaw.bottom), fontId: arcFont, materialId: sheetId(arcRaw.materialId) } : null,
      frameMaterialId: d.frameMaterialId == null ? null : sheetId(d.frameMaterialId),
      holes: oneOf(read, d.holes, [0, 2, 4] as const, "holes"),
      selfAdhesive: d.selfAdhesive === true,
      positioningStencil: d.positioningStencil === true,
      logoDevelopment: d.logoDevelopment === true,
      logoBrief: brief,
      quantity: read.quantity(read.num(d.quantity, "quantity")),
    };
  } catch {
    return null;
  }
}
