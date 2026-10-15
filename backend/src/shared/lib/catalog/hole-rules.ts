// Hole choice limits (Денис 2026-10-10: positions top, bottom, centre, right, left; diameter
// 3–30 mm). The hole may take at most 40 % of the piece diameter and leaves at least 3 mm of
// acrylic to the outer edge, so the piece does not break at the hole.
// Copied as is to backend/src/shared/lib/catalog/hole-rules.ts.

import type { HolePosition, HoleRules, RawHoleRules } from "../../types/hole";

export const HOLE_POSITIONS: readonly HolePosition[] = ["top", "bottom", "left", "right", "center"];

export const DEFAULT_HOLE_RULES: HoleRules = {
  positions: ["top", "bottom", "left", "right", "center"],
  defaultPosition: "top",
  minMm: 3,
  maxMm: 30,
  maxShare: 0.4,
  edgeMm: 3,
};

const isPosition = (value: unknown): value is HolePosition => typeof value === "string" && (HOLE_POSITIONS as readonly string[]).includes(value);

/** A number from the metadata inside [lo, hi], or the fallback when it is missing or out of range. */
function bounded(value: unknown, lo: number, hi: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= lo && value <= hi ? value : fallback;
}

/**
 * Hole rules of a product from its metadata; null when the product has no hole choice.
 * Values outside the production limits fall back to the defaults, so the admin cannot
 * open a choice the machine cannot cut.
 */
export function readHoleRules(raw: RawHoleRules | null | undefined): HoleRules | null {
  if (!raw || typeof raw !== "object") return null;
  const d = DEFAULT_HOLE_RULES;
  const positions = Array.isArray(raw.positions) ? raw.positions.filter(isPosition) : [];
  const allowed = positions.length ? Array.from(new Set(positions)) : d.positions;
  const minMm = bounded(raw.min_mm, d.minMm, d.maxMm, d.minMm);
  const maxMm = bounded(raw.max_mm, minMm, d.maxMm, d.maxMm);
  return {
    positions: allowed,
    defaultPosition: isPosition(raw.default_position) && allowed.includes(raw.default_position) ? raw.default_position : allowed[0],
    minMm,
    maxMm,
    maxShare: bounded(raw.max_share, 0.1, d.maxShare, d.maxShare),
    edgeMm: bounded(raw.edge_mm, d.edgeMm, 20, d.edgeMm),
  };
}

/** Hole offered when the page opens: 4 mm on pieces under 10 cm, 6 mm from 10 cm, within the piece limit. */
export function defaultHoleMm(pieceMm: number, rules: HoleRules, maxMm: number): number {
  const preferred = pieceMm < 100 ? 4 : 6;
  return Math.max(rules.minMm, Math.min(preferred, maxMm));
}
