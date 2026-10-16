// Too-thin places of a stencil, found with a morphological opening (Clipper2 offset in
// and back out). Material strips narrower than minPartMm break after a few washes;
// cut slots narrower than minSlotMm do not let paint through.

import type { LaserConfig, Polygon, ThinZone, ThinZoneKind } from "../../types/geometry";
import { bboxOf, polygonsNetArea, polygonsPerimeter, signedArea } from "../calculators/geometry";
import { ARC_TOLERANCE_MM, difference, inflate, unionTree, type TreeNode } from "./clipper";

/** A lost piece counts as thin only if its mean width is at least this share of the limit. */
const THIN_MIN_WIDTH_SHARE = 0.3;

/** Splits a set of polygons into separate pieces (outer contour + its holes). */
function pieces(polygons: ReadonlyArray<Polygon>, scale: number): Polygon[][] {
  const out: Polygon[][] = [];
  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      const holes = node.children.map((child) => child.polygon);
      out.push([node.polygon, ...holes]);
      for (const hole of node.children) walk(hole.children);
    }
  };
  walk(unionTree(polygons, scale));
  return out;
}

/** Areas of `region` thinner than `widthMm`. */
export function thinParts(region: ReadonlyArray<Polygon>, widthMm: number, kind: ThinZoneKind, cfg: LaserConfig): ThinZone[] {
  if (!region.length || widthMm <= 0) return [];
  const scale = cfg.clipperScale;
  // Morphological opening (shrink by half the width, grow back), grown back by one arc
  // tolerance more: the kept shape then never shares an edge with the region, so the
  // difference has no coincident edges (clipper2-js returns garbage triangles on those) and
  // no hairline slivers where the round corners only approximate the curve.
  const kept = inflate(inflate(region, -widthMm / 2, scale), widthMm / 2 + ARC_TOLERANCE_MM, scale);
  const lost = difference(region, kept, scale);
  const threshold = Math.max(cfg.minReportAreaMm2, widthMm * widthMm);
  // Outlines that cannot make a zone are dropped before nesting (a 90 cm alphabet leaves
  // thousands of crumbs): a piece is never larger nor wider on average than its own outline.
  const large = lost.filter((polygon) => {
    const area = Math.abs(signedArea(polygon));
    return area >= threshold && (2 * area) / Math.max(1e-6, polygonsPerimeter([polygon])) >= widthMm * THIN_MIN_WIDTH_SHARE;
  });
  const zones: ThinZone[] = [];
  for (const piece of pieces(large, scale)) {
    const areaMm2 = polygonsNetArea(piece);
    if (areaMm2 < threshold) continue;
    // A real thin strip loses its whole width. Slivers shaved off the corners of a flattened
    // curve (large letters) are long but a fraction of a millimetre wide: not a problem
    // (QA 2026-10-10, m2: 26 false marks on a 100 cm stencil).
    const meanWidthMm = (2 * areaMm2) / Math.max(1e-6, polygonsPerimeter(piece));
    if (meanWidthMm < widthMm * THIN_MIN_WIDTH_SHARE) continue;
    const box = bboxOf([piece[0]]);
    zones.push({ kind, areaMm2, at: [(box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2] });
  }
  return zones;
}

/**
 * Thin material between cuts and thin cut slots of a stencil.
 * `sheet` is the stencil outline; `cut` the final cut regions (bridges already applied).
 */
export function findThinZones(sheet: Polygon, cut: ReadonlyArray<Polygon>, cfg: LaserConfig): ThinZone[] {
  const material = difference([sheet], cut, cfg.clipperScale);
  return [
    ...thinParts(material, cfg.minPartMm, "material", cfg),
    ...thinParts(cut, cfg.minSlotMm, "slot", cfg),
  ];
}
