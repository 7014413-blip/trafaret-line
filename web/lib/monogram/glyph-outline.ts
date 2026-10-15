// Letters, ampersand and date of a monogram: font outlines placed into a design element
// (centre, capital height, widest width), in design units. One contour group per glyph,
// so the stencil cutter resolves the holes of every letter on its own.

import type { Polygon, Vec2 } from "../../types/geometry";
import type { MonogramGlyphElement } from "../../types/monogram";
import type { LoadedFont } from "../../types/text";
import { bboxOf } from "../calculators/geometry";
import { glyphFor } from "../text/glyph";
import { capHeightUnits, flattenCommands, LAYOUT_SIZE } from "../text/text-layout";

export interface PlacedText {
  /** One group per visible glyph, design units. */
  groups: Polygon[][];
  /** Capital height after fitting into maxWidth, design units. */
  cap: number;
  missing: string[];
}

export function placeText(font: LoadedFont, text: string, element: MonogramGlyphElement): PlacedText {
  const missing: string[] = [];
  const raw: Vec2[][][] = [];
  let pen = 0;
  for (const ch of [...text]) {
    const { font: face, glyph, ok } = glyphFor(font.faces, ch);
    if (!ok) missing.push(ch);
    const contours = flattenCommands(glyph.getPath(pen, 0, LAYOUT_SIZE).commands);
    if (ok && contours.length) raw.push(contours);
    pen += ((glyph.advanceWidth ?? 0) * LAYOUT_SIZE) / face.unitsPerEm;
  }
  if (!raw.length) return { groups: [], cap: element.cap, missing };

  const box = bboxOf(raw.flat());
  let k = element.cap / capHeightUnits(font);
  const width = (box.maxX - box.minX) * k;
  if (width > element.maxWidth) k *= element.maxWidth / width;
  const cap = capHeightUnits(font) * k;
  // Centre the ink horizontally; the capital height sits around cy, the baseline below it.
  const dx = element.cx - ((box.minX + box.maxX) / 2) * k;
  const dy = element.cy + cap / 2;
  const groups = raw.map((group) => group.map((contour) => contour.map(([x, y]) => [x * k + dx, y * k + dy] as Vec2)));
  return { groups, cap, missing };
}
