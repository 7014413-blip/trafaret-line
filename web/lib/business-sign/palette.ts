// Sheets of the business sign: the common acrylic palette (lib/calculators/signage.ts) with the
// letter minimums of this constructor (mirror 12 mm, other sheets 10 mm [default, Claude
// 2026-10-10], the same as the pointer signs and floor plaques cut from these sheets).

import type { AcrylicSheet } from "../../types/signage";
import { ACRYLIC_PALETTE } from "../calculators/signage";
import { DEFAULT_BUSINESS_SIGN_CONFIG } from "./config";

export const BUSINESS_SIGN_PALETTE: AcrylicSheet[] = ACRYLIC_PALETTE.map((sheet) => ({
  ...sheet,
  minLetterMm: sheet.finish === "mirror" ? DEFAULT_BUSINESS_SIGN_CONFIG.minLetterMirrorMm : DEFAULT_BUSINESS_SIGN_CONFIG.minLetterMm,
}));

export function findBusinessSignSheet(id: string): AcrylicSheet {
  return BUSINESS_SIGN_PALETTE.find((sheet) => sheet.id === id) ?? BUSINESS_SIGN_PALETTE[0];
}
