// Checks the buyer's hole choice against the product rules and the chosen piece size.
// The browser shows the error next to the field; the checkout runs the same check on the
// server (backend/src/shared/lib/catalog/check-hole.ts is a copy of this file).

import type { HoleCheck, HoleInput, HoleRules } from "../../types/hole";
import { holeCentreMm, holeEdgeMm, maxHoleMm } from "./hole-geometry";

/** Diameter as typed: digits with an optional decimal comma or point, e.g. «6» or «6,5». */
function parseDiameter(text: string): number | null {
  const clean = text.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d)?$/.test(clean)) return null;
  return Number(clean);
}

export function checkHole(input: HoleInput, pieceMm: number, rules: HoleRules): HoleCheck {
  const maxMm = maxHoleMm(pieceMm, rules.maxMm, rules.maxShare, rules.edgeMm);
  if (!rules.positions.includes(input.position)) return { spec: null, error: "position_not_allowed", maxMm };
  const diameterMm = parseDiameter(input.diameterMm);
  if (diameterMm === null) return { spec: null, error: "diameter_not_number", maxMm };
  if (diameterMm < rules.minMm) return { spec: null, error: "diameter_too_small", maxMm };
  if (diameterMm > maxMm) return { spec: null, error: "diameter_too_large", maxMm };
  const edgeMm = input.position === "center" ? (pieceMm - diameterMm) / 2 : holeEdgeMm(diameterMm, rules.edgeMm);
  return {
    spec: {
      position: input.position,
      diameterMm,
      pieceMm,
      edgeMm: Math.round(edgeMm * 10) / 10,
      centreMm: holeCentreMm(pieceMm, input.position, diameterMm, rules.edgeMm),
    },
    error: null,
    maxMm,
  };
}
