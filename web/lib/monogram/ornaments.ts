// Ornament outlines of the monogram designs: open arc, leafy branch or sprig, heart, line.
// Pure geometry in design units (100 × 100 box, y down); every piece is a closed polygon.
// Strokes never close into a ring, so the ornaments make no islands of material by
// themselves; leaves overlap their stem and merge with it into one cut.

import type { Polygon, Vec2 } from "../../types/geometry";
import type { MonogramArcElement, MonogramBranchElement, MonogramHeartElement, MonogramLineElement } from "../../types/monogram";
import { heartShape } from "../geometry/shapes";

const DEG = Math.PI / 180;

/** Points of a circle segment, about one point per unit of length. */
function arcPoints(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): Vec2[] {
  const sweep = (toDeg - fromDeg) * DEG;
  const steps = Math.max(12, Math.ceil(Math.abs(sweep) * r));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = fromDeg * DEG + (sweep * i) / steps;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Vec2;
  });
}

/** Closed outline of a polyline stroke of the given width with round caps. */
export function strokeOutline(points: ReadonlyArray<Vec2>, width: number): Polygon {
  const half = width / 2;
  const left: Vec2[] = [];
  const right: Vec2[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    left.push([points[i][0] + nx * half, points[i][1] + ny * half]);
    right.push([points[i][0] - nx * half, points[i][1] - ny * half]);
  }
  const cap = (centre: Vec2, from: Vec2, clockwise: boolean): Vec2[] => {
    const start = Math.atan2(from[1] - centre[1], from[0] - centre[0]);
    return Array.from({ length: 7 }, (_, i) => {
      const a = start + (clockwise ? 1 : -1) * (Math.PI * (i + 1)) / 8;
      return [centre[0] + half * Math.cos(a), centre[1] + half * Math.sin(a)] as Vec2;
    });
  };
  const last = points[points.length - 1];
  const first = points[0];
  return [...left, ...cap(last, left[left.length - 1], false), ...right.reverse(), ...cap(first, right[right.length - 1], false)];
}

export function arcOutline(element: MonogramArcElement, width: number): Polygon[] {
  return [strokeOutline(arcPoints(element.cx, element.cy, element.r, element.from, element.to), width)];
}

export function lineOutline(element: MonogramLineElement, width: number): Polygon[] {
  const dx = element.x2 - element.x1;
  const dy = element.y2 - element.y1;
  const length = Math.hypot(dx, dy) || 1;
  const nx = (-dy / length) * (width / 2);
  const ny = (dx / length) * (width / 2);
  return [[
    [element.x1 + nx, element.y1 + ny],
    [element.x2 + nx, element.y2 + ny],
    [element.x2 - nx, element.y2 - ny],
    [element.x1 - nx, element.y1 - ny],
  ]];
}

/**
 * Almond leaf from its base along the direction `angle` (radians). The base starts inside
 * the stem and already has some width, so the leaf joins the stem without a hairline neck.
 */
export function leafOutline(base: Vec2, angle: number, length: number, width: number): Polygon {
  const steps = 14;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const nx = -uy;
  const ny = ux;
  const half = (t: number) => (width / 2) * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * t)), 0.75);
  const side = (sign: 1 | -1): Vec2[] => Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const h = t === 1 ? 0 : half(t) * sign;
    return [base[0] + ux * length * t + nx * h, base[1] + uy * length * t + ny * h] as Vec2;
  });
  return [...side(1), ...side(-1).reverse().slice(1, -1)];
}

/** Stem centre line of a branch, ~1 unit per point, from the root to the tip. */
function stemPoints(path: MonogramBranchElement["path"]): Vec2[] {
  if (path.type === "arc") return arcPoints(path.cx, path.cy, path.r, path.from, path.to);
  const length = Math.hypot(path.x2 - path.x1, path.y2 - path.y1);
  const steps = Math.max(2, Math.ceil(length));
  return Array.from({ length: steps + 1 }, (_, i) => [
    path.x1 + ((path.x2 - path.x1) * i) / steps,
    path.y1 + ((path.y2 - path.y1) * i) / steps,
  ] as Vec2);
}

/** Point and direction on a polyline at the distance s from its start. */
function along(points: ReadonlyArray<Vec2>, s: number): { at: Vec2; angle: number } {
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segment = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (walked + segment >= s || i === points.length - 1) {
      const t = segment ? Math.min(1, Math.max(0, (s - walked) / segment)) : 0;
      return { at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    }
    walked += segment;
  }
  return { at: points[0], angle: 0 };
}

function polylineLength(points: ReadonlyArray<Vec2>): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return total;
}

/**
 * Branch: stem plus leaves pointing towards the tip, alternating sides (or in pairs), and
 * one leaf continuing the stem at the tip. Leaves shrink a little towards the tip.
 * `stemWidth` and `minLeafWidth` already include the slot limit of the chosen size.
 */
export function branchOutline(element: MonogramBranchElement, stemWidth: number, minLeafWidth: number): Polygon[] {
  const stem = stemPoints(element.path);
  const total = polylineLength(stem);
  const pieces: Polygon[] = [strokeOutline(stem, stemWidth)];
  const spread = element.leafAngle * DEG;
  const sinkIn = stemWidth / 2;
  let index = 0;
  for (let s = element.bareStart; s < total - element.leafLength * 0.35; s += element.leafStep) {
    const { at, angle } = along(stem, s);
    const shrink = 1 - 0.3 * (s / total);
    const length = element.leafLength * shrink;
    const width = Math.max(minLeafWidth, element.leafWidth * shrink);
    const sides: (1 | -1)[] = element.layout === "pairs" ? [1, -1] : [index % 2 === 0 ? 1 : -1];
    for (const sign of sides) {
      const direction = angle + sign * spread;
      const base: Vec2 = [at[0] - Math.cos(direction) * sinkIn, at[1] - Math.sin(direction) * sinkIn];
      pieces.push(leafOutline(base, direction, length + sinkIn, width));
    }
    index++;
  }
  const tip = along(stem, total);
  const tipBase: Vec2 = [tip.at[0] - Math.cos(tip.angle) * sinkIn * 2, tip.at[1] - Math.sin(tip.angle) * sinkIn * 2];
  pieces.push(leafOutline(tipBase, tip.angle, element.leafLength * 0.8 + sinkIn * 2, Math.max(minLeafWidth, element.leafWidth * 0.8)));
  return pieces;
}

export function heartOutline(element: MonogramHeartElement): Polygon[] {
  return heartShape(element.size).map((polygon) =>
    polygon.map(([x, y]) => [x + element.cx - element.size / 2, y + element.cy - element.size / 2] as Vec2));
}
