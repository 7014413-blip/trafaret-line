// Openings of a positioning (mounting) template: the customer lays the template on the wall and
// drops each acrylic piece into its opening. The openings are the outlines of the pieces grown by
// the tolerance (0.2 mm), so a piece goes in without force but cannot shift. Touching pieces give
// one opening. The result goes to the TEMPLATE layer of the machine file (lib/export/layers.ts).

import { CONSTRUCTOR_CONFIG } from "./config";
import { inflate, union } from "./clipper";
import { DEFAULT_LASER } from "./laser-config";
import type { Polygon, Vec2 } from "../../types/geometry";

export function positioningTemplateOpenings(
  pieces: ReadonlyArray<Polygon>,
  toleranceMm: number = CONSTRUCTOR_CONFIG.positioningToleranceMm,
  scale: number = DEFAULT_LASER.clipperScale,
): Vec2[][] {
  if (!pieces.length) return [];
  return inflate(union(pieces, scale), toleranceMm, scale);
}
