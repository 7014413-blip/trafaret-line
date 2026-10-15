// Grows filled shapes by a small distance (Minkowski sum with a disk): the shape united with
// a band of width 2·delta along every edge and a disk at every vertex. Used instead of the
// Clipper offset for tiny deltas on dense font outlines, where clipper2-js 1.2.4 leaves saw
// teeth on flattened curves.

import type { Polygon, Vec2 } from "../../types/geometry";
import { signedArea } from "../calculators/geometry";
import { FillRule, union } from "./clipper";

const DISK_SEGMENTS = 8;

function withSign(polygon: Vec2[], positive: boolean): Vec2[] {
  return signedArea(polygon) > 0 === positive ? polygon : polygon.reverse();
}

/** `polygons` must be a clean shape (outer contours and holes of opposite winding). */
export function growPolygons(polygons: ReadonlyArray<Polygon>, deltaMm: number, scale: number): Vec2[][] {
  if (deltaMm <= 0 || !polygons.length) return polygons.map((p) => [...p]);
  // Pieces get the winding of the largest contour, which is an outer one.
  const largest = polygons.reduce((a, b) => (Math.abs(signedArea(b)) > Math.abs(signedArea(a)) ? b : a));
  const positive = signedArea(largest) > 0;
  const pieces: Vec2[][] = [];
  for (const polygon of polygons) {
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length > 1e-6) {
        const nx = (-(b[1] - a[1]) / length) * deltaMm;
        const ny = ((b[0] - a[0]) / length) * deltaMm;
        pieces.push(withSign([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], positive));
      }
      pieces.push(withSign(Array.from({ length: DISK_SEGMENTS }, (_, k) => {
        const angle = (k / DISK_SEGMENTS) * Math.PI * 2;
        return [a[0] + deltaMm * Math.cos(angle), a[1] + deltaMm * Math.sin(angle)] as Vec2;
      }), positive));
    }
  }
  return union([...polygons, ...pieces], scale, FillRule.NonZero);
}
