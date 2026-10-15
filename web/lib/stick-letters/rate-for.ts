// Rate per m² of a set: the sheet's own rate when the product prices sheets apart (sign-letters),
// else the rate with self-adhesive, or without it when the product has one and the tape is off.

import type { StickLettersConfig } from "../../types/stick-letters";

export function stickRateFor(cfg: StickLettersConfig, materialId: string, adhesive: boolean): number {
  const sheetRate = cfg.materialRates?.[materialId];
  if (sheetRate != null) return sheetRate;
  return adhesive || cfg.rateNoAdhesivePerM2 == null ? cfg.ratePerM2 : cfg.rateNoAdhesivePerM2;
}
