// Every number of the constructors in one place (ТЗ «prompt-konstruktory» v0.9, table 2;
// values from docs/tz/trebovaniya-peremychki-i-svarka.md v1). After the analysis of
// Денис's own layouts only this file and the test references change, not the algorithms.

import type { BridgeStrength, ConstructorConfig } from "../../types/geometry";
import type { MaterialType } from "../../types/customizer";

export const CONSTRUCTOR_CONFIG: ConstructorConfig = {
  curveToleranceMm: 0.05,
  bridgeWidthRatio: 0.05,
  bridgeWidthMinMm: 2.5,
  bridgeWidthMaxMm: 8,
  bridgeStrength: { thin: 0.8, normal: 1, strong: 1.4 },
  islandOneBridgeMaxHeightMm: 20,
  islandLongPerimeterMm: 250,
  bridgesPerIslandMax: 4,
  jointThicknessFactor: 1.8,
  bridgeZoneShare: 0.6,
  bridgeLongWarnMm: 40,
  minSlotMm: 1,
  positioningToleranceMm: 0.2, // Денис's prompt, accepted 2026-10-15 (PROEKT-SAYTU §13.2)
  weldOverlapRatio: 0.02,
  weldOverlapMinMm: 1.2,
  weldOverlapMaxOfNarrow: 0.15,
  weldPunctOverlapMax: 0.1,
  weldLookback: 2,
  weldMergeAreaShare: 0.15,
  dotConnectorMaxOfDot: 0.8,
  connectorWidthRatio: 0.12,
  connectorWidthMinMm: 3,
  baseBarHeightRatio: 0.12,
  outlineOffsetMm: 3,
  stickWidthMm: 6,
  stickLengthMm: 70,
  stickSingleMaxWidthMm: 120,
  sheetMarginMm: 15,
  sheetMaxMm: { width: 1400, height: 2000 },
};

/** Minimum material between cuts (stencil) or minimum stroke (welded piece), mm. */
export function minMaterialMm(materialId: MaterialType): number {
  if (materialId.includes("mirror")) return 3;
  if (materialId.startsWith("acrylic")) return 2;
  return 1.5; // PET 0.5, polystyrene 1, thin boards
}

/** Smallest capital letter that cuts cleanly in this material, mm (warning below). */
export function minCapHeightMm(materialId: MaterialType): number {
  if (materialId.startsWith("acrylic")) return 25;
  if (materialId.startsWith("polystyrene")) return 20;
  return 15;
}

/** Bridge width multiplier of the «Перемички: тонкі / звичайні / міцні» control. */
export function bridgeStrengthFactor(strength: BridgeStrength, cfg: ConstructorConfig = CONSTRUCTOR_CONFIG): number {
  return cfg.bridgeStrength[strength] ?? 1;
}

/** Skewers of a topper by its width: one up to 120 mm, two above. */
export function defaultStickCount(widthMm: number, cfg: ConstructorConfig = CONSTRUCTOR_CONFIG): 1 | 2 {
  return widthMm <= cfg.stickSingleMaxWidthMm ? 1 : 2;
}
