// Union of overlapping solid pieces (a stem and its leaves, a stroke and its caps). Every
// piece is turned the same way first, so NonZero merges overlaps instead of cancelling them
// (EvenOdd, used per group by the stencil cutter, would cut the overlaps out).

import type { Polygon, Vec2 } from "../../types/geometry";
import { signedArea } from "../calculators/geometry";
import { FillRule, union } from "./clipper";

export function unionSolids(pieces: ReadonlyArray<Polygon>, scale: number): Vec2[][] {
  const same = pieces.map((piece) => (signedArea(piece) > 0 ? [...piece] : [...piece].reverse()));
  return union(same, scale, FillRule.NonZero);
}
