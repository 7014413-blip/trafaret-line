// Mounting template: openings 0.2 mm larger than the pieces, touching pieces share one opening.

import { describe, expect, it } from "vitest";
import { positioningTemplateOpenings } from "@/lib/geometry/positioning-template";
import type { Polygon } from "@/types/geometry";

const square = (x: number, y: number, size: number): Polygon => [[x, y], [x + size, y], [x + size, y + size], [x, y + size]];

const bounds = (polygon: ReadonlyArray<readonly [number, number]>) => ({
  minX: Math.min(...polygon.map((p) => p[0])), maxX: Math.max(...polygon.map((p) => p[0])),
  minY: Math.min(...polygon.map((p) => p[1])), maxY: Math.max(...polygon.map((p) => p[1])),
});

describe("positioningTemplateOpenings", () => {
  it("grows every piece by 0.2 mm on each side", () => {
    const [opening, ...rest] = positioningTemplateOpenings([square(0, 0, 100)]);
    expect(rest).toHaveLength(0);
    const b = bounds(opening);
    expect(b.minX).toBeCloseTo(-0.2, 2);
    expect(b.maxX).toBeCloseTo(100.2, 2);
    expect(b.minY).toBeCloseTo(-0.2, 2);
    expect(b.maxY).toBeCloseTo(100.2, 2);
  });

  it("joins touching pieces into one opening and keeps separate ones apart", () => {
    expect(positioningTemplateOpenings([square(0, 0, 10), square(10, 0, 10)])).toHaveLength(1);
    expect(positioningTemplateOpenings([square(0, 0, 10), square(30, 0, 10)])).toHaveLength(2);
  });

  it("gives nothing for no pieces", () => {
    expect(positioningTemplateOpenings([])).toEqual([]);
  });
});
