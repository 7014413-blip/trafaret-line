// Single acrylic numbers and letters (Денис 2026-10-11): acrylic 3 mm, any colour, 2–80 cm high,
// 7500 UAH per m² with self-adhesive and 6500 UAH per m² without, every character its own piece
// priced by its outer box. [default] Claude 2026-10-11: one order at least 150 UAH (the site
// minimum), rounded up to 10 UAH; no stencil (single characters are placed by eye).

import type { StickLettersConfig } from "../../types/stick-letters";

export const ACRYLIC_CHARS_CONFIG: StickLettersConfig = {
  product: "chars",
  title: { uk: "Акрилові цифри і літери", ru: "Акриловые цифры и буквы", en: "Acrylic numbers and letters" },
  ratePerM2: 7500,                     // Денис, with self-adhesive
  rateNoAdhesivePerM2: 6500,           // Денис, without
  stencil: false,
  joinable: false,
  minPrice: 150,                       // [default]
  roundTo: 10,
  thicknessMm: 3,                      // Денис
  minLetterMm: 20,                     // Денис: from 2 cm
  maxLetterMm: 800,                    // Денис: up to 80 cm
  maxLines: 4,                         // [default]
  maxLineChars: 40,
  rowGapShare: 0.35,
  touchShare: 0.02,
  stencilMarginMm: 15,
  maxPieceWidthMm: 1950,               // laser bed 1400 × 2000 mm, with a margin
  maxPieceHeightMm: 1350,
};
