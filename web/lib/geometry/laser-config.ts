// Production limits of the laser (admin setting). The numbers come from the single
// constructor config (lib/geometry/config.ts); this file keeps the shape the cutter uses.

import type { BridgeStrength, LaserConfig } from "../../types/geometry";
import { bridgeStrengthFactor, CONSTRUCTOR_CONFIG as C } from "./config";

export const DEFAULT_LASER: LaserConfig = {
  minBridgeMm: C.bridgeWidthMinMm,
  maxBridgeMm: C.bridgeWidthMaxMm,
  bridgeShareOfCap: C.bridgeWidthRatio,
  maxBridgeLengthMm: C.bridgeLongWarnMm,
  minPartMm: 1.5,
  minSlotMm: C.minSlotMm,
  secondBridgeFromMm: C.islandOneBridgeMaxHeightMm,
  bridgePerPerimeterMm: C.islandLongPerimeterMm,
  maxBridgesPerIsland: C.bridgesPerIslandMax,
  bridgeOverlapMm: 0.4,
  sampleStepMm: 1,
  clipperScale: 1000,
  minReportAreaMm2: 2.5,
};

/**
 * Bridge width for a given cap height: grows with the letters, scaled by the strength
 * control (тонкі ×0.8, звичайні ×1, міцні ×1.4), always within the limits.
 */
export function bridgeWidthFor(capHeightMm: number, cfg: LaserConfig = DEFAULT_LASER, strength: BridgeStrength = "normal"): number {
  const proportional = capHeightMm * cfg.bridgeShareOfCap * bridgeStrengthFactor(strength);
  return Math.min(cfg.maxBridgeMm, Math.max(cfg.minBridgeMm, proportional));
}

/** Laser limits for a material: the minimum part follows the material (PET 1.5 … mirror 3 mm). */
export function laserFor(minPartMm: number, cfg: LaserConfig = DEFAULT_LASER): LaserConfig {
  return { ...cfg, minPartMm };
}
