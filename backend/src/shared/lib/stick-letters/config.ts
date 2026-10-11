// Self-adhesive letters settings (admin). Денис 2026-10-10: acrylic 3 mm, 7000 UAH per m², a
// cardboard stencil for gluing comes with the set. [default] Claude 2026-10-10: the rate counts
// the outer box of every cut piece; one set costs at least 150 UAH (as the wedding initials),
// rounded up to 10 UAH; letters 1.5–30 cm; up to 6 lines.

import type { StickLettersConfig } from "../../types/stick-letters";

export const DEFAULT_STICK_LETTERS_CONFIG: StickLettersConfig = {
  product: "letters",
  title: { uk: "Самоклейні літери", ru: "Самоклеящиеся буквы", en: "Self-adhesive letters" },
  ratePerM2: 7000,                     // Денис
  rateNoAdhesivePerM2: null,
  stencil: true,
  joinable: true,
  minPrice: 150,                       // [default]
  roundTo: 10,
  thicknessMm: 3,                      // Денис
  minLetterMm: 15,                     // [default]
  maxLetterMm: 300,                    // [default]
  maxLines: 6,                         // [default]
  maxLineChars: 40,
  rowGapShare: 0.35,
  touchShare: 0.02,
  stencilMarginMm: 15,
  maxPieceWidthMm: 1950,               // laser bed 1400 × 2000 mm, with a margin
  maxPieceHeightMm: 1350,
};
