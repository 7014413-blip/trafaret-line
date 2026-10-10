// Places a measured edge text along a circle around the sign centre (mm, Y down).
// Top text reads clockwise over the top with the letters standing outwards; bottom text reads
// left to right under the bottom with the letters standing towards the centre. The letters are
// as tall as the band allows and smaller when the text would take more than the largest angle.

import type { BusinessSignArcMeasure, BusinessSignArcPlacement } from "../../types/business-sign";
import { polygonsToPathData } from "../geometry/svg-path";

export function placeArcText(
  measure: BusinessSignArcMeasure, position: "top" | "bottom", bandInnerR: number, bandOuterR: number, capShare: number, maxSpanDeg: number,
): BusinessSignArcPlacement {
  const band = Math.max(0, bandOuterR - bandInnerR);
  const bandCap = band * capShare;
  const margin = (band - bandCap) / 2;
  // Top letters stand on the inner side of the band, bottom letters hang from the outer side.
  const baselineR = position === "top" ? bandInnerR + margin : bandOuterR - margin;
  const maxArc = (maxSpanDeg * Math.PI / 180) * baselineR;
  const advancePerCap = measure.totalAdvance / Math.max(1e-6, measure.capUnits);
  const capMm = Math.max(0, Math.min(bandCap, maxArc / Math.max(1e-6, advancePerCap)));
  const scale = capMm / Math.max(1e-6, measure.capUnits);
  const span = (measure.totalAdvance * scale) / Math.max(1e-6, baselineR);

  const polygons: [number, number][][] = [];
  let pen = 0;
  for (const glyph of measure.glyphs) {
    const halfAdvance = (glyph.advance * scale) / 2;
    const centreAngle = -span / 2 + (pen + halfAdvance) / Math.max(1e-6, baselineR);
    pen += glyph.advance * scale;
    // Top: position (r·sinθ, −r·cosθ), rotation θ; bottom: position (r·sinθ, r·cosθ), rotation −θ.
    const rotation = position === "top" ? centreAngle : -centreAngle;
    const px = baselineR * Math.sin(centreAngle);
    const py = position === "top" ? -baselineR * Math.cos(centreAngle) : baselineR * Math.cos(centreAngle);
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    for (const contour of glyph.contours) {
      polygons.push(contour.map(([x, y]) => {
        const lx = x * scale - halfAdvance;
        const ly = y * scale;
        return [px + lx * cos - ly * sin, py + lx * sin + ly * cos] as [number, number];
      }));
    }
  }
  return { position, pathData: polygonsToPathData(polygons), capMm, missing: measure.missing };
}
