// Outline of a text element of «Вільне полотно» in local millimetres: the letters at the given
// cap height, one group per glyph, bounding box from (0, 0). Used by the canvas editor and by
// the production files, so the server rebuilds the element the customer placed.

import type { Polygon, Vec2 } from "../../types/geometry";
import type { LoadedFont } from "../../types/text";
import { textToDesign } from "../text/text-layout";

export function canvasTextOutline(font: LoadedFont, text: string, capMm: number): { groups: Polygon[][]; widthMm: number; heightMm: number } {
  const layout = textToDesign(font, text, { align: "center" });
  const k = capMm / Math.max(1, layout.capUnits);
  return {
    groups: layout.glyphs
      .filter((g) => g.contours.length)
      .map((g) => g.contours.map((c) => c.map(([x, y]) => [x * k, y * k] as Vec2))),
    widthMm: layout.design.bboxMm.w * k,
    heightMm: layout.design.bboxMm.h * k,
  };
}
