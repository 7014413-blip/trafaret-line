// One line of self-adhesive letters in its font: outline for the preview, the size of the line
// and the box of every glyph (to tell which letters touch and become one piece).

import type { StickLineMeasure } from "../../types/stick-letters";
import type { LoadedFont } from "../../types/text";
import { bboxOf } from "../calculators/geometry";
import { textToDesign } from "../text/text-layout";
import { stickLineText } from "./line-text";

export interface MeasuredStickLine {
  measure: StickLineMeasure;
  /** SVG path data in layout units, box starting at (0, 0). */
  pathData: string;
  missing: string[];
}

export function measureStickLine(font: LoadedFont, text: string, upper: boolean): MeasuredStickLine | null {
  const clean = stickLineText(text, upper);
  if (!clean) return null;
  const result = textToDesign(font, clean, { align: "left", maxLines: 1 });
  const glyphs = result.glyphs
    .filter((g) => g.contours.some((c) => c.length > 2))
    .map((g) => {
      const box = bboxOf(g.contours.filter((c) => c.length > 2));
      return { char: g.char, minX: box.minX, maxX: box.maxX, minY: box.minY, maxY: box.maxY };
    });
  return {
    measure: {
      widthUnits: Math.max(1, result.design.bboxMm.w),
      heightUnits: Math.max(1, result.design.bboxMm.h),
      capUnits: result.capUnits,
      glyphs,
    },
    pathData: result.pathData,
    missing: result.missing,
  };
}
