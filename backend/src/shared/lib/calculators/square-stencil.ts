// Square custom stencils from PET 0.5 mm (Денис 2026-10-10): fixed prices per piece for the
// square sizes, used instead of the area price (the quantity discount still applies).
// Other materials and other sizes keep the area price.

import type { MaterialType, SheetSize } from "../../types/customizer";

export interface SquareStencilPreset {
  sideMm: number;
  price: number;
}

/** Material the square prices are for. */
export const SQUARE_STENCIL_MATERIAL: MaterialType = "pet_thin";

export const SQUARE_STENCIL_PRESETS: SquareStencilPreset[] = [
  { sideMm: 200, price: 120 },
  { sideMm: 300, price: 200 },
  { sideMm: 400, price: 290 },
  { sideMm: 500, price: 400 },
  { sideMm: 600, price: 540 },
  { sideMm: 700, price: 750 },
  { sideMm: 800, price: 1300 },
];

/** Fixed price of a square PET stencil of a listed size, or null when the area price applies. */
export function squareStencilPrice(sheet: SheetSize, materialId: MaterialType): number | null {
  if (materialId !== SQUARE_STENCIL_MATERIAL || sheet.shape === "circle" || sheet.shape === "oval" || sheet.shape === "heart") return null;
  if (Math.round(sheet.widthMm) !== Math.round(sheet.heightMm)) return null;
  return SQUARE_STENCIL_PRESETS.find((p) => p.sideMm === Math.round(sheet.widthMm))?.price ?? null;
}
