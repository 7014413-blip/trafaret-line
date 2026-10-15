// One text line of a plaque (pointer sign, office plaque) in its own font: outline for the preview and the
// measures the layouts need (lib/plaques/fit-lines.ts). Each line is laid out alone, so
// every line can have its own font, including the customer's own fonts.

import type { PlaqueLineMeasure } from "../../types/plaques";
import type { LoadedFont } from "../../types/text";
import { textToDesign } from "../text/text-layout";

export interface MeasuredPlaqueLine {
  measure: PlaqueLineMeasure;
  /** SVG path data in layout units, box starting at (0, 0). */
  pathData: string;
  missing: string[];
}

export function measurePlaqueLine(font: LoadedFont, text: string): MeasuredPlaqueLine | null {
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
