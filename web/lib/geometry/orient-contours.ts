// Font outlines → contours with a reliable winding. Some fonts (variable fonts exported as
// static) have overlapping contours inside one glyph and holes that run the same way as
// the outer contour, so neither EvenOdd (overlaps turn into holes) nor NonZero (counters
// get filled) works as is. Here a contour lying completely inside an odd number of other
// contours is a hole; outer contours are turned counter-clockwise, holes clockwise (in
// y-down coordinates the signs are as returned by signedArea), and NonZero then gives the
// true filled shape.

import type { Polygon, Vec2 } from "../../types/geometry";
import { pointInPolygon, signedArea } from "../calculators/geometry";

/** True when every point of `inner` lies inside `outer` (a merely overlapping contour is not inside). */
function containedIn(inner: Polygon, outer: Polygon): boolean {
  const step = Math.max(1, Math.floor(inner.length / 24));
  for (let i = 0; i < inner.length; i += step) if (!pointInPolygon(inner[i], outer)) return false;
  return true;
}

export function orientContours(contours: ReadonlyArray<Polygon>): Vec2[][] {
  const areas = contours.map((c) => Math.abs(signedArea(c)));
  return contours.map((contour, i) => {
    let depth = 0;
    for (let j = 0; j < contours.length; j++) {
      if (j !== i && areas[j] > areas[i] && containedIn(contour, contours[j])) depth++;
    }
    const wantPositive = depth % 2 === 0;
    const positive = signedArea(contour) > 0;
    return positive === wantPositive ? [...contour] : [...contour].reverse();
  });
}
