// Too-thin places of a stencil, found with a morphological opening (Clipper2 offset in
// and back out). Material strips narrower than minPartMm break after a few washes;
// cut slots narrower than minSlotMm do not let paint through.

import type { LaserConfig, Polygon, ThinZone, ThinZoneKind } from "../../types/geometry";
import { bboxOf, polygonsNetArea, polygonsPerimeter } from "../calculators/geometry";
import { difference, opening, unionTree, type TreeNode } from "./clipper";

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
  const kept = opening(region, widthMm / 2, scale);
  const lost = difference(region, kept, scale);
  const threshold = Math.max(cfg.minReportAreaMm2, widthMm * widthMm);
  const zones: ThinZone[] = [];
  for (const piece of pieces(lost, scale)) {
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
