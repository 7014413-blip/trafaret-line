// Affine helpers for millimetre polygons: move, scale and rotate outlines.

import type { Polygon, Vec2 } from "../../types/geometry";
import { bboxOf } from "../calculators/geometry";

export function translatePolygon(polygon: Polygon, dx: number, dy: number): Vec2[] {
  return polygon.map(([x, y]) => [x + dx, y + dy] as Vec2);
}

export function translatePolygons(polygons: ReadonlyArray<Polygon>, dx: number, dy: number): Vec2[][] {
  return polygons.map((p) => translatePolygon(p, dx, dy));
}

export function scalePolygons(polygons: ReadonlyArray<Polygon>, factor: number): Vec2[][] {
  return polygons.map((p) => p.map(([x, y]) => [x * factor, y * factor] as Vec2));
}

/**
 * Places a local outline (bounding box starting at 0,0) on the sheet: scale around the
 * origin, rotate clockwise around the centre of the scaled box, then move the box so its
 * top-left corner is at (x, y). Same convention as Fabric.js with originX/originY "left"/"top"
 * and centred rotation.
 */
export function placePolygons(
  polygons: ReadonlyArray<Polygon>, widthMm: number, heightMm: number,
  transform: { x: number; y: number; scale: number; angle: number },
): Vec2[][] {
  const w = widthMm * transform.scale;
  const h = heightMm * transform.scale;
  const cx = w / 2;
  const cy = h / 2;
  const radians = (transform.angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return polygons.map((polygon) =>
    polygon.map(([x, y]) => {
      const sx = x * transform.scale - cx;
      const sy = y * transform.scale - cy;
      return [transform.x + cx + sx * cos - sy * sin, transform.y + cy + sx * sin + sy * cos] as Vec2;
    }),
  );
}

/** Moves polygons so their bounding box starts at (0, 0); returns the size. */
export function normaliseToOrigin(polygons: ReadonlyArray<Polygon>): { polygons: Vec2[][]; widthMm: number; heightMm: number } {
  const box = bboxOf(polygons);
  return {
    polygons: translatePolygons(polygons, -box.minX, -box.minY),
    widthMm: box.maxX - box.minX,
    heightMm: box.maxY - box.minY,
  };
}
