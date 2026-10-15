// Wedding initials settings (admin). Денис 2026-10-10: 8200 UAH per m², size and colour by choice.
// [default] Claude 2026-10-10: at least 150 UAH per set (the site minimum), rounded up to
// 10 UAH; letters 3–25 cm; separator bar 5.5 % of the letter height; topper strip 12 %
// (at least 4 mm) and a pointed skewer as long as the letters.

import type { InitialsConfig } from "../../types/initials";

export const DEFAULT_INITIALS_CONFIG: InitialsConfig = {
  ratePerM2: 8200,                     // Денис
  minPrice: 150,                       // [default]
  roundTo: 10,
  minLetterMm: 30,
  maxLetterMm: 250,
  maxChars: 3,
  gapShare: 0.28,
  barWidthShare: 0.055,
  barMinWidthMm: 3,
  barHeightShare: 1.3,
  stripShare: 0.12,
  stripMinMm: 4,
  skewerWidthShare: 0.12,
  skewerMinWidthMm: 6,
  skewerLengthShare: 1,
};
