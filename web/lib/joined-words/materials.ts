// Sheets for «Написи на планці»: the acrylic and mirror acrylic palette of the sign constructor
// (lib/calculators/signage.ts), one layer 3 mm [default, Claude 2026-10-10]. Every colour costs the same.

import type { JoinedWordsMaterial } from "../../types/joined-words";
import { ACRYLIC_PALETTE } from "../calculators/signage";

export const JOINED_WORDS_MATERIALS: JoinedWordsMaterial[] = ACRYLIC_PALETTE.map((sheet) => ({
  id: sheet.id,
  name: sheet.name,
  hex: sheet.hex,
  mirror: sheet.finish === "mirror",
  thicknessMm: 3,
  minLetterMm: sheet.minLetterMm,
  inStock: sheet.inStock,
}));
