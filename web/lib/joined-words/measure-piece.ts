// One piece of «Написи на планці» in its font: outline for the preview, the measures the layout
// needs, characters the font lacks and characters with parts that do not reach the strip (the
// dots of «і», the breve of «Й», a hyphen): those parts come off as separate small pieces.

import type { JoinedPieceMeasure, JoinedWordsConfig } from "../../types/joined-words";
import type { BBox } from "../../types/geometry";
import type { LoadedFont } from "../../types/text";
import { bboxOf } from "../calculators/geometry";
import { textToDesign } from "../text/text-layout";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";

export interface MeasuredJoinedPiece {
  measure: JoinedPieceMeasure;
  /** SVG path data in layout units, box starting at (0, 0). */
  pathData: string;
  missing: string[];
  /** Characters with a part that does not touch the strip. */
  loose: string[];
}

/** Text of a piece as it is cut: spaces collapsed, capitals when asked. */
export function joinedPieceText(text: string, upper: boolean): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return upper ? clean.toUpperCase() : clean;
}

const inside = (inner: BBox, outer: BBox) =>
  inner.minX >= outer.minX && inner.maxX <= outer.maxX && inner.minY >= outer.minY && inner.maxY <= outer.maxY;

export function measureJoinedPiece(
  font: LoadedFont, text: string, upper: boolean, cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG,
): MeasuredJoinedPiece | null {
  const clean = joinedPieceText(text, upper);
  if (!clean) return null;
  const result = textToDesign(font, clean, { align: "left", maxLines: 1 });
  const baseline = result.glyphs[0]?.baselineY ?? result.design.bboxMm.h;
  // A contour reaches the strip when its bottom is below the strip top (Y down).
  const stripTop = baseline - result.capUnits * cfg.barShare * cfg.barOverlapShare;
  const loose = new Set<string>();
  for (const glyph of result.glyphs) {
    const boxes = glyph.contours.filter((c) => c.length > 2).map((c) => bboxOf([c]));
    const touching = boxes.filter((b) => b.maxY >= stripTop);
    if (boxes.some((b) => b.maxY < stripTop && !touching.some((t) => inside(b, t)))) loose.add(glyph.char);
  }
  return {
    measure: {
      widthUnits: Math.max(1, result.design.bboxMm.w),
      heightUnits: Math.max(1, result.design.bboxMm.h),
      capUnits: result.capUnits,
      baselineUnits: baseline,
    },
    pathData: result.pathData,
    missing: result.missing,
    loose: [...loose],
  };
}
