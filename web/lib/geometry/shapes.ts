// Ready shapes for the free canvas, as outlines in local mm (bounding box from 0,0).

import type { CanvasShapeKind } from "../../types/canvas";
import type { Polygon, Vec2 } from "../../types/geometry";

/** Regular polygon approximating a circle, ~1 mm segments. */
export function circleShape(sizeMm: number): Polygon[] {
  const r = sizeMm / 2;
  const segments = Math.max(48, Math.ceil(Math.PI * sizeMm));
  return [Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return [r + r * Math.cos(a), r + r * Math.sin(a)] as Vec2;
  })];
}

export function rectShape(widthMm: number, heightMm: number): Polygon[] {
  return [[[0, 0], [widthMm, 0], [widthMm, heightMm], [0, heightMm]]];
}

/** Five-pointed star, inner radius 40 % of the outer. */
export function starShape(sizeMm: number, points = 5, innerShare = 0.4): Polygon[] {
  const r = sizeMm / 2;
  const outline: Vec2[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? r : r * innerShare;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    outline.push([r + radius * Math.cos(a), r + radius * Math.sin(a)]);
  }
  return [outline];
}

/** Heart from the classic parametric curve, scaled into a square of sizeMm. */
export function heartShape(sizeMm: number): Polygon[] {
  const raw: Vec2[] = [];
  const steps = 160;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    raw.push([x, y]);
  }
  const xs = raw.map((p) => p[0]);
  const ys = raw.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const scale = sizeMm / Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
  return [raw.map(([x, y]) => [(x - minX) * scale, (y - minY) * scale] as Vec2)];
}

/** Rectangular frame: outer contour and inner contour (hole) `borderMm` inside. */
export function frameShape(widthMm: number, heightMm: number, borderMm: number): Polygon[] {
  const b = Math.min(borderMm, widthMm / 3, heightMm / 3);
  return [
    [[0, 0], [widthMm, 0], [widthMm, heightMm], [0, heightMm]],
    [[b, b], [b, heightMm - b], [widthMm - b, heightMm - b], [widthMm - b, b]],
  ];
}

/** Default outline of a shape button on the canvas. */
/** Size a new shape of «Вільне полотно» gets before the customer scales it, mm. */
export const CANVAS_SHAPE_SIZE_MM = 80;

export function shapeOutline(kind: CanvasShapeKind, sizeMm: number): { groups: Polygon[][]; widthMm: number; heightMm: number } {
  switch (kind) {
    case "circle":
      return { groups: [circleShape(sizeMm)], widthMm: sizeMm, heightMm: sizeMm };
    case "rect":
      return { groups: [rectShape(sizeMm, sizeMm * 0.6)], widthMm: sizeMm, heightMm: sizeMm * 0.6 };
    case "star":
      return { groups: [starShape(sizeMm)], widthMm: sizeMm, heightMm: sizeMm };
    case "heart": {
      const outline = heartShape(sizeMm);
      const xs = outline[0].map((p) => p[0]);
      const ys = outline[0].map((p) => p[1]);
      return { groups: [outline], widthMm: Math.max(...xs), heightMm: Math.max(...ys) };
    }
    case "frame":
      return { groups: [frameShape(sizeMm * 1.5, sizeMm, Math.max(6, sizeMm * 0.08))], widthMm: sizeMm * 1.5, heightMm: sizeMm };
  }
}
