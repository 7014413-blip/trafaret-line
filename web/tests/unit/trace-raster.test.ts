// Marching squares outlines: a filled square, a ring (outline + hole) and sub-pixel accuracy.

import { describe, expect, it } from "vitest";
import { traceRaster } from "@/lib/geometry/trace-raster";
import { FillRule, union } from "@/lib/geometry/clipper";

const area = (p: ReadonlyArray<readonly [number, number]>) =>
  Math.abs(p.reduce((s, [x, y], i) => { const [nx, ny] = p[(i + 1) % p.length]; return s + x * ny - nx * y; }, 0) / 2);

function raster(w: number, h: number, inside: (x: number, y: number) => number): Float32Array {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = inside(x + 0.5, y + 0.5);
  return out;
}

describe("traceRaster", () => {
  it("outlines a filled block in pixel units", () => {
    // Pixels 2…7 filled (6 × 6): the iso line runs half way between filled and empty centres,
    // the four corners are cut by half a pixel triangle each.
    const values = raster(10, 10, (x, y) => (x > 2 && x < 8 && y > 2 && y < 8 ? 1 : 0));
    const [contour, ...rest] = traceRaster(values, 10, 10);
    expect(rest).toHaveLength(0);
    expect(area(contour)).toBeCloseTo(35.5, 5);
  });

  it("gives an outer contour and a hole for a ring", () => {
    const values = raster(40, 40, (x, y) => { const r = Math.hypot(x - 20, y - 20); return r < 15 && r > 8 ? 1 : 0; });
    const contours = traceRaster(values, 40, 40);
    expect(contours).toHaveLength(2);
    const regions = union(contours, 1000, FillRule.EvenOdd);
    const outer = Math.max(...regions.map(area));
    const hole = Math.min(...regions.map(area));
    expect(outer - hole).toBeGreaterThan(Math.PI * (15 ** 2 - 8 ** 2) * 0.9);
    expect(outer - hole).toBeLessThan(Math.PI * (15 ** 2 - 8 ** 2) * 1.1);
  });

  it("places an anti-aliased edge between pixels by the grey level", () => {
    // Column 5 is 30 % covered: the 0.5 level lies 0.5 / 0.7 of the way from centre 4.5 to 5.5.
    const values = raster(10, 10, (x) => (x < 5 ? 1 : x < 6 ? 0.3 : 0));
    const [contour] = traceRaster(values, 10, 10);
    const right = Math.max(...contour.map(([x]) => x));
    expect(right).toBeCloseTo(4.5 + 0.5 / 0.7, 5);
  });
});
