// Thin adapter around Clipper2 (clipper2-js): converts millimetre polygons to the
// integer paths Clipper works with and back, and wraps the operations the cutter and
// the welder need. Coordinates are multiplied by LaserConfig.clipperScale (1000 = 1 µm).

import { Clipper, ClipperOffset, EndType, FillRule, JoinType, Path64, Paths64 } from "clipper2-js";
import type { Polygon, Vec2 } from "../../types/geometry";

export { FillRule };

export function toPath64(polygon: Polygon, scale: number): Path64 {
  const path = new Path64();
  for (const [x, y] of polygon) {
    path.push({ x: Math.round(x * scale), y: Math.round(y * scale) });
  }
  return path;
}

export function toPaths64(polygons: ReadonlyArray<Polygon>, scale: number): Paths64 {
  const paths = new Paths64();
  for (const polygon of polygons) {
    if (polygon.length >= 3) paths.push(toPath64(polygon, scale));
  }
  return paths;
}

export function fromPath64(path: Path64, scale: number): Vec2[] {
  return path.map((point) => [point.x / scale, point.y / scale] as Vec2);
}

/**
 * clipper2-js 1.2.4 sometimes returns repeated vertices and zero-area slivers; they are
 * removed here so every consumer sees clean closed polygons.
 */
export function cleanPaths(paths: Paths64): Paths64 {
  const out = new Paths64();
  for (const path of paths) {
    const clean = new Path64();
    for (const point of path) {
      const last = clean[clean.length - 1];
      if (!last || last.x !== point.x || last.y !== point.y) clean.push(point);
    }
    while (clean.length > 1 && clean[0].x === clean[clean.length - 1].x && clean[0].y === clean[clean.length - 1].y) clean.pop();
    if (clean.length >= 3 && Math.abs(Clipper.area(clean)) >= 1) out.push(clean);
  }
  return out;
}

export function fromPaths64(paths: Paths64, scale: number): Vec2[][] {
  return cleanPaths(paths).map((path) => fromPath64(path, scale));
}

/** Union of polygons. EvenOdd for raw glyph outlines, NonZero for already normalised paths. */
export function union(polygons: ReadonlyArray<Polygon>, scale: number, fillRule: FillRule = FillRule.NonZero): Vec2[][] {
  if (!polygons.length) return [];
  return fromPaths64(Clipper.Union(toPaths64(polygons, scale), undefined, fillRule), scale);
}

export function difference(subject: ReadonlyArray<Polygon>, clip: ReadonlyArray<Polygon>, scale: number): Vec2[][] {
  if (!subject.length) return [];
  if (!clip.length) return subject.map((p) => [...p]);
  return fromPaths64(Clipper.Difference(toPaths64(subject, scale), toPaths64(clip, scale), FillRule.NonZero), scale);
}

export function intersect(subject: ReadonlyArray<Polygon>, clip: ReadonlyArray<Polygon>, scale: number): Vec2[][] {
  if (!subject.length || !clip.length) return [];
  return fromPaths64(Clipper.Intersect(toPaths64(subject, scale), toPaths64(clip, scale), FillRule.NonZero), scale);
}

/** Largest gap between a round corner and its straight-segment approximation, mm. */
const ARC_TOLERANCE_MM = 0.05;

/**
 * Offsets closed polygons by delta mm (negative = shrink) with round corners. The arc
 * tolerance is set explicitly: the library default (0.25 integer units = 0.25 µm here)
 * builds every corner from hundreds of points and makes offsets take seconds.
 */
export function inflate(polygons: ReadonlyArray<Polygon>, deltaMm: number, scale: number): Vec2[][] {
  if (!polygons.length) return [];
  const offset = new ClipperOffset(2, ARC_TOLERANCE_MM * scale);
  offset.addPaths(toPaths64(polygons, scale), JoinType.Round, EndType.Polygon);
  const solution = new Paths64();
  offset.execute(deltaMm * scale, solution);
  return fromPaths64(solution, scale);
}

/**
 * Morphological opening: shrink by r, grow back by r. Parts narrower than 2r vanish,
 * so `difference(input, opening(input))` is exactly the too-thin areas.
 */
export function opening(polygons: ReadonlyArray<Polygon>, radiusMm: number, scale: number): Vec2[][] {
  return inflate(inflate(polygons, -radiusMm, scale), radiusMm, scale);
}

/** Node of the nesting tree in millimetres. */
export interface TreeNode {
  polygon: Vec2[];
  isHole: boolean;
  /** Depth: 1 = top-level outer contour, 2 = its hole, 3 = outer inside that hole … */
  level: number;
  children: TreeNode[];
}

/** Even-odd point-in-polygon on integer paths. */
function insidePath(x: number, y: number, path: Path64): boolean {
  let inside = false;
  for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
    const a = path[i];
    const b = path[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** A point strictly inside the polygon near its first edge, used to test which polygon contains it. */
function probePoint(path: Path64): { x: number; y: number } {
  // Longest edge: its midpoint moved a tiny bit along the normal, towards the polygon's own interior.
  let k = 0;
  let longest = -1;
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const q = path[(i + 1) % path.length];
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    if (len > longest) {
      longest = len;
      k = i;
    }
  }
  const a = path[k];
  const b = path[(k + 1) % path.length];
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const step = 0.5;
  const left = { x: mx - (dy / length) * step, y: my + (dx / length) * step };
  return insidePath(left.x, left.y, path) ? left : { x: mx + (dy / length) * step, y: my - (dx / length) * step };
}

/**
 * Union with NonZero filling, returned as the nesting tree (outer → holes → outer …).
 * The union paths never cross, so nesting is found by containment: the parent of a path
 * is the smallest other path that contains a point just inside it. (Built here instead of
 * Clipper's PolyTree, which fails silently in the clipper2-js 1.2.4 port.)
 */
export function unionTree(polygons: ReadonlyArray<Polygon>, scale: number): TreeNode[] {
  const paths = cleanPaths(Clipper.Union(toPaths64(polygons, scale), undefined, FillRule.NonZero));
  const areas = paths.map((p) => Math.abs(Clipper.area(p)));
  const parents = paths.map((path, i) => {
    const probe = probePoint(path);
    let parent = -1;
    for (let j = 0; j < paths.length; j++) {
      if (j === i || areas[j] <= areas[i]) continue;
      if (insidePath(probe.x, probe.y, paths[j]) && (parent < 0 || areas[j] < areas[parent])) parent = j;
    }
    return parent;
  });
  const nodes: TreeNode[] = paths.map((path) => ({ polygon: fromPath64(path, scale), isHole: false, level: 1, children: [] }));
  const roots: TreeNode[] = [];
  const setLevel = (node: TreeNode, level: number) => {
    node.level = level;
    node.isHole = level % 2 === 0;
    for (const child of node.children) setLevel(child, level + 1);
  };
  nodes.forEach((node, i) => (parents[i] < 0 ? roots : nodes[parents[i]].children).push(node));
  for (const root of roots) setLevel(root, 1);
  return roots;
}

/** Normalises each group of raw contours with EvenOdd (holes inside a glyph), then returns all paths. */
export function normaliseGroups(groups: ReadonlyArray<ReadonlyArray<Polygon>>, scale: number): Vec2[][] {
  const out: Vec2[][] = [];
  for (const group of groups) out.push(...union(group, scale, FillRule.EvenOdd));
  return out;
}

/** Drops vertices closer than toleranceMm to the outline (Ramer–Douglas–Peucker); shape stays within the tolerance. */
export function simplify(polygons: ReadonlyArray<Polygon>, toleranceMm: number, scale: number): Vec2[][] {
  if (!polygons.length) return [];
  return fromPaths64(Clipper.simplifyPaths(toPaths64(polygons, scale), toleranceMm * scale, true), scale);
}
