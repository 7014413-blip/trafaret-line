// Numbers of the monogram stencils in one place. Small sheets (5 × 5 cm for a cookie) need
// finer bridges than the constructor default of 2.5 mm: here a bridge is 10 % of the
// initials' height (Денис's own layouts: ≈10 %), never thinner than the narrowest strip of
// PET that survives washing (1.5 mm) and never wider than 4 mm.

import type { LaserConfig } from "../../types/geometry";
import { DEFAULT_LASER } from "../geometry/laser-config";

export const MONOGRAM_CONFIG = {
  /** Share of the sheet side the 100-unit design box takes (the rest is the margin). */
  designShare: 0.82,
  bridgeShareOfCap: 0.1,
  bridgeMinMm: 1.5,
  bridgeMaxMm: 4,
  /** Narrowest cut that sugar or cocoa still passes through, mm. */
  minSlotMm: 1,
  /** Smallest capital height of the date and of the ampersand on small sheets, mm. */
  minDateCapMm: 5.5,
  minAmpCapMm: 4.5,
  /** Below this capital height the date is hard to read: the page suggests a short date or a bigger size, mm. */
  smallDateCapMm: 4,
  /** Hairline widening never goes beyond this share of the capital height per side. */
  maxGrowShareOfCap: 0.05,
  initialMaxLength: 1,
  dateMaxLength: 12,
} as const;

/** Bridge width for initials of this capital height, mm. */
export function monogramBridgeWidth(capMm: number): number {
  return Math.min(MONOGRAM_CONFIG.bridgeMaxMm, Math.max(MONOGRAM_CONFIG.bridgeMinMm, capMm * MONOGRAM_CONFIG.bridgeShareOfCap));
}

/** Laser limits for monogram stencils: the default ones with the finer bridge range. */
export function monogramLaser(base: LaserConfig = DEFAULT_LASER): LaserConfig {
  return { ...base, minBridgeMm: MONOGRAM_CONFIG.bridgeMinMm, maxBridgeMm: MONOGRAM_CONFIG.bridgeMaxMm, minSlotMm: MONOGRAM_CONFIG.minSlotMm };
}
