// Welded word at the width the customer asked for. Moving letters together shortens
// the word, so the scale is found in two passes: weld at the first guess (without the
// skewers, which do not change the width), measure, correct the scale, weld again.
// Result is moved to start at (0, 0).

import type { PlacedGlyph, TextAlign, Vec2, WeldOptions, WeldResult } from "../../types/geometry";
import type { SizedWeld } from "../../types/geometry-worker";
import { bboxOf } from "../calculators/geometry";
import { glyphsToMm } from "../text/text-layout";
import { translatePolygons } from "./transform";
import { weldText } from "./weld";

/** Moves a weld result so its bounding box starts at the origin. */
export function weldToOrigin(result: WeldResult): WeldResult {
  const dx = -result.bbox.minX;
  const dy = -result.bbox.minY;
  const shapes: Vec2[][] = translatePolygons(result.shapes, dx, dy);
  return { ...result, shapes, bbox: { minX: 0, minY: 0, maxX: result.bbox.maxX + dx, maxY: result.bbox.maxY + dy } };
}

export function weldAtWidth(
  glyphs: PlacedGlyph[], capUnits: number, targetWidthMm: number, align: TextAlign, options: WeldOptions,
): SizedWeld | null {
  const withOutlines = glyphs.filter((g) => g.contours.length);
  if (!withOutlines.length || targetWidthMm <= 0) return null;
  const box = bboxOf(withOutlines.flatMap((g) => g.contours));
  const firstScale = targetWidthMm / Math.max(1e-6, box.maxX - box.minX);
  let scale = firstScale;
  // Skewers hang inside the width of the word, so the measuring pass leaves them out.
  const measuring: WeldOptions = { ...options, skewers: { ...options.skewers, count: 0 } };
  const first = weldText(glyphsToMm(glyphs, scale, 0, 0), capUnits * scale, align, measuring);
  const width = first.bbox.maxX - first.bbox.minX;
  if (width > 0 && Math.abs(width - targetWidthMm) > 0.5) scale *= targetWidthMm / width;
  const result = scale === firstScale && !options.skewers.count
    ? first
    : weldText(glyphsToMm(glyphs, scale, 0, 0), capUnits * scale, align, options);
  return { result: weldToOrigin(result), capMm: capUnits * scale, scale };
}
