// Area and perimeter of contours and of the sheet shapes. Pure functions in mm:
// the same file runs in the browser (live preview) and on the server (price check).

import type { Contour, SheetSize, VectorDesign } from "../../types/customizer";
import type { BBox, Polygon, Vec2 } from "../../types/geometry";
import { MACHINE_SHEET_MM } from "../materials";

/** Distance between two points, mm. */
export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Length of an open or closed polyline, mm. */
export function polylineLength(points: ReadonlyArray<Vec2>, closed: boolean): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }
  if (closed && points.length > 2) {
    length += distance(points[points.length - 1], points[0]);
  }
  return length;
}

/** Length of one contour in mm (closing segment included for closed contours). */
export function contourLength(contour: Contour): number {
  return polylineLength(contour.points, contour.closed);
}

/** Signed area by the shoelace formula, mm². Positive = counter-clockwise in a y-up system. */
export function signedArea(points: ReadonlyArray<Vec2>): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/** Signed area of a contour, mm². */
export function contourArea(contour: Contour): number {
  return signedArea(contour.points);
}

/** Total perimeter of several closed polygons, mm. */
export function polygonsPerimeter(polygons: ReadonlyArray<Polygon>): number {
  return polygons.reduce((sum, p) => sum + polylineLength(p, true), 0);
}

/** Net area of polygons where holes have the opposite winding (Clipper output), mm². */
export function polygonsNetArea(polygons: ReadonlyArray<Polygon>): number {
  return Math.abs(polygons.reduce((sum, p) => sum + signedArea(p), 0));
}

/** Bounding box of a set of polygons. Empty input gives a zero box at the origin. */
export function bboxOf(polygons: ReadonlyArray<ReadonlyArray<Vec2>>): BBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const polygon of polygons) {
    for (const [x, y] of polygon) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

/** Even-odd point-in-polygon test. */
export function pointInPolygon(point: Vec2, polygon: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = yi > point[1] !== yj > point[1];
    if (crosses && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Nearest point on segment a–b to p. */
export function nearestOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return a;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq));
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Nearest point on a closed polygon outline to p, with the distance. */
export function nearestOnPolygon(p: Vec2, polygon: Polygon): { point: Vec2; distance: number } {
  let best: Vec2 = polygon[0];
  let bestDistance = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const candidate = nearestOnSegment(p, polygon[i], polygon[(i + 1) % polygon.length]);
    const d = distance(p, candidate);
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }
  return { point: best, distance: bestDistance };
}

/** Sheet outline length for the laser, mm. Oval uses Ramanujan's approximation. */
export function sheetPerimeterMm(sheet: SheetSize): number {
  if (sheet.shape === "circle") return Math.PI * sheet.widthMm;
  if (sheet.shape === "oval") {
    const a = sheet.widthMm / 2;
    const b = sheet.heightMm / 2;
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  }
  return 2 * (sheet.widthMm + sheet.heightMm);
}

/** Billing area: bounding rectangle of the sheet for every shape (ТЗ §3.3), m². */
export function billingAreaM2(sheet: SheetSize): number {
  return (sheet.widthMm * sheet.heightMm) / 1_000_000;
}

/** Real material area of the sheet shape, m² (used for weight). */
export function shapeAreaM2(sheet: SheetSize): number {
  const rectangle = (sheet.widthMm * sheet.heightMm) / 1_000_000;
  if (sheet.shape === "circle" || sheet.shape === "oval") return (rectangle * Math.PI) / 4;
  // A heart drawn in its bounding box fills about 70 % of it.
  if (sheet.shape === "heart") return rectangle * 0.7;
  return rectangle;
}

/** How many machine sheets a large stencil is split into (the better of both orientations). */
export function piecesFor(sheet: SheetSize, max: { width: number; height: number } = MACHINE_SHEET_MM): number {
  const fit = (a: number, b: number) => Math.ceil(a / max.width) * Math.ceil(b / max.height);
  return Math.min(fit(sheet.widthMm, sheet.heightMm), fit(sheet.heightMm, sheet.widthMm));
}

/**
 * Sheet size for a text design: width chosen by the customer, height follows the
 * text proportions plus the margin on both sides (default 15 mm).
 */
export function sheetForDesign(design: VectorDesign, widthMm: number, marginMm = 15): SheetSize {
  const inner = Math.max(1, widthMm - 2 * marginMm);
  const scale = inner / Math.max(1, design.bboxMm.w);
  return { shape: "rect", widthMm, heightMm: Math.ceil(design.bboxMm.h * scale + 2 * marginMm) };
}
