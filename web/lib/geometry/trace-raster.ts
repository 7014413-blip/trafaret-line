// Outlines of a greyscale raster (marching squares): every closed contour where the value
// crosses the iso level, with the crossing interpolated between neighbouring samples, so the
// outline of an anti-aliased picture is accurate to a fraction of a pixel. The raster is padded
// with empty samples, so every contour closes. Contours come back in pixel units (sample i sits
// at i + 0.5) without a fixed direction: nested outlines are read with the EvenOdd fill rule.
// Used to turn a rendered catalogue master layout into cut contours (lib/masters on the server).

import type { Vec2 } from "../../types/geometry";

/** Edges of a cell: top, right, bottom, left. */
type Edge = 0 | 1 | 2 | 3;
const T: Edge = 0, R: Edge = 1, B: Edge = 2, L: Edge = 3;

/** Segments of each case (corner bits: top-left 8, top-right 4, bottom-right 2, bottom-left 1). */
const SEGMENTS: ReadonlyArray<ReadonlyArray<readonly [Edge, Edge]>> = [
  [], [[L, B]], [[B, R]], [[L, R]], [[T, R]], [], [[T, B]], [[L, T]],
  [[L, T]], [[T, B]], [], [[T, R]], [[L, R]], [[B, R]], [[L, B]], [],
];
/** Saddle cases 5 and 10: [centre inside, centre outside]. */
const SADDLE: Record<5 | 10, readonly [ReadonlyArray<readonly [Edge, Edge]>, ReadonlyArray<readonly [Edge, Edge]>]> = {
  5: [[[L, T], [B, R]], [[T, R], [L, B]]],
  10: [[[T, R], [L, B]], [[L, T], [B, R]]],
};

export function traceRaster(values: ArrayLike<number>, width: number, height: number, iso = 0.5): Vec2[][] {
  // Padded grid: (width + 2) × (height + 2) samples, the border is empty.
  const gw = width + 2;
  const gh = height + 2;
  const at = (gx: number, gy: number) =>
    gx < 1 || gy < 1 || gx > width || gy > height ? 0 : values[(gy - 1) * width + (gx - 1)];

  const points = new Map<number, Vec2>();
  const links = new Map<number, number[]>();
  const pointOn = (cx: number, cy: number, edge: Edge): number => {
    // Horizontal edges are keyed by their left sample, vertical ones by their top sample.
    const key = edge === T ? 2 * (cy * gw + cx)
      : edge === B ? 2 * ((cy + 1) * gw + cx)
      : edge === L ? 2 * (cy * gw + cx) + 1
      : 2 * (cy * gw + cx + 1) + 1;
    if (!points.has(key)) {
      const [ax, ay, bx, by] = edge === T ? [cx, cy, cx + 1, cy]
        : edge === B ? [cx, cy + 1, cx + 1, cy + 1]
        : edge === L ? [cx, cy, cx, cy + 1]
        : [cx + 1, cy, cx + 1, cy + 1];
      const va = at(ax, ay);
      const vb = at(bx, by);
      const t = va === vb ? 0.5 : Math.min(1, Math.max(0, (iso - va) / (vb - va)));
      // Sample (gx, gy) is the pixel (gx - 1, gy - 1), whose centre is at + 0.5.
      points.set(key, [ax + (bx - ax) * t - 0.5, ay + (by - ay) * t - 0.5]);
    }
    return key;
  };
  const link = (a: number, b: number) => {
    const la = links.get(a);
    if (la) la.push(b); else links.set(a, [b]);
    const lb = links.get(b);
    if (lb) lb.push(a); else links.set(b, [a]);
  };

  for (let cy = 0; cy < gh - 1; cy++) {
    for (let cx = 0; cx < gw - 1; cx++) {
      const tl = at(cx, cy), tr = at(cx + 1, cy), br = at(cx + 1, cy + 1), bl = at(cx, cy + 1);
      const code = (tl > iso ? 8 : 0) | (tr > iso ? 4 : 0) | (br > iso ? 2 : 0) | (bl > iso ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const segments = code === 5 || code === 10
        ? SADDLE[code][(tl + tr + br + bl) / 4 > iso ? 0 : 1]
        : SEGMENTS[code];
      for (const [a, b] of segments) link(pointOn(cx, cy, a), pointOn(cx, cy, b));
    }
  }

  // Every crossing has exactly two neighbours: walk each loop once.
  const contours: Vec2[][] = [];
  const visited = new Set<number>();
  for (const start of links.keys()) {
    if (visited.has(start)) continue;
    const loop: Vec2[] = [];
    let previous = -1;
    let current = start;
    while (!visited.has(current)) {
      visited.add(current);
      loop.push(points.get(current) as Vec2);
      const next = (links.get(current) ?? []).find((n) => n !== previous && !visited.has(n));
      if (next === undefined) break;
      previous = current;
      current = next;
    }
    if (loop.length >= 3) contours.push(loop);
  }
  return contours;
}
