// Interlaced look of a stencil monogram: where the ampersand crosses a letter, the letter is
// cut back around the ampersand, so a strip of sheet runs between them. On a stencil two
// overlapping holes would merge into one blot; with the strip the ampersand reads as lying
// on top of the letters, like in a drawn monogram.

import type { Polygon, Vec2 } from "../../types/geometry";
import { signedArea } from "../calculators/geometry";
import { difference, simplify } from "../geometry/clipper";
import { CONSTRUCTOR_CONFIG } from "../geometry/config";
import { growPolygons } from "../geometry/grow";
import { unionSolids } from "../geometry/union-solids";

/**
 * Cuts `gapMm` of sheet around `top` (the ampersand, counters filled) out of every group in
 * `under` (the letters). Slivers smaller than `minPieceMm2` that the cut leaves are dropped:
 * a laser cannot cut them cleanly and sugar would not pass through them anyway.
 */
export function knockOut(
  under: ReadonlyArray<ReadonlyArray<Polygon>>,
  top: ReadonlyArray<Polygon>,
  gapMm: number,
  minPieceMm2: number,
  scale: number,
): Vec2[][][] {
  // The widened ampersand outline is dense (every widened hairline adds points); thinned out
  // to the curve tolerance first, the strip around it is built in milliseconds.
  const silhouette = simplify(unionSolids(top, scale), CONSTRUCTOR_CONFIG.curveToleranceMm, scale);
  const halo = growPolygons(silhouette, gapMm, scale);
  return under.map((group) =>
    difference(group, halo, scale).filter((contour) => Math.abs(signedArea(contour)) >= minPieceMm2),
  );
}
