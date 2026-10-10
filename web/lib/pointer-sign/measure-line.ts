// One text line of a pointer sign in its own font: outline for the preview and the
// measures the layout needs (lib/pointer-sign/layout.ts). Each line is laid out alone, so
// every line can have its own font, including the customer's own fonts.

import type { PointerLineMeasure } from "../../types/pointer-sign";
import type { LoadedFont } from "../../types/text";
import { textToDesign } from "../text/text-layout";

export interface MeasuredPointerLine {
  measure: PointerLineMeasure;
  /** SVG path data in layout units, box starting at (0, 0). */
  pathData: string;
  missing: string[];
}

export function measurePointerLine(font: LoadedFont, text: string): MeasuredPointerLine | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const result = textToDesign(font, clean, { align: "center", maxLines: 1 });
  const baseline = result.glyphs[0]?.baselineY ?? result.design.bboxMm.h;
  return {
    measure: {
      widthUnits: Math.max(1, result.design.bboxMm.w),
      heightUnits: Math.max(1, result.design.bboxMm.h),
      capUnits: result.capUnits,
      baselineUnits: baseline,
    },
    pathData: result.pathData,
    missing: result.missing,
  };
}
