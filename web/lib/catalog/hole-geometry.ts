// Where a hole of a given diameter sits on a round piece. Off-centre holes keep a band of
// acrylic to the outer edge that grows with the hole (half its diameter, never less than the
// rule minimum), the same proportion as on Денис's keyring blanks.
// Copied as is to backend/src/shared/lib/catalog/hole-geometry.ts.

import type { HolePosition } from "../../types/hole";

/** Acrylic left between an off-centre hole and the outer edge, mm (0.1 mm steps). */
export function holeEdgeMm(diameterMm: number, minEdgeMm: number): number {
  return Math.round(Math.max(minEdgeMm, diameterMm / 2) * 10) / 10;
}

/** Hole centre in mm from the centre of a round piece; x to the right, y down. */
export function holeCentreMm(pieceMm: number, position: HolePosition, diameterMm: number, minEdgeMm: number): [number, number] {
  if (position === "center") return [0, 0];
  const r = Math.round((pieceMm / 2 - holeEdgeMm(diameterMm, minEdgeMm) - diameterMm / 2) * 10) / 10;
  if (position === "top") return [0, -r];
  if (position === "bottom") return [0, r];
  if (position === "left") return [-r, 0];
  return [r, 0];
}

/** Largest hole a round piece allows: the rule limits, the share of the diameter and room for the edge band. */
export function maxHoleMm(pieceMm: number, maxMm: number, maxShare: number, minEdgeMm: number): number {
  // An off-centre hole with its edge band must not pass the centre of the piece: d/2 + edge(d) ≤ piece/2.
  let byFit = maxMm;
  while (byFit > 0 && byFit / 2 + holeEdgeMm(byFit, minEdgeMm) > pieceMm / 2) byFit -= 1;
  return Math.max(0, Math.min(maxMm, Math.floor(pieceMm * maxShare), byFit));
}
