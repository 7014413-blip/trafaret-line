// «Написи на планці» settings (admin). Денис 2026-10-10: one layer of acrylic, the letters of a
// word joined by a strip under them, 7000 UAH per m² of the product.
// [default] Claude 2026-10-10: the rate counts the outer box of every cut piece; one set costs
// at least 250 UAH (the acrylic minimum of the site), rounded up to 10 UAH; acrylic 3 mm;
// letters 1.5–30 cm; the strip is 10 % of the letter height, 3–12 mm.

import type { JoinedWordsConfig } from "../../types/joined-words";

export const DEFAULT_JOINED_WORDS_CONFIG: JoinedWordsConfig = {
  ratePerM2: 7000,                     // Денис
  minPrice: 250,                       // [default]
  roundTo: 10,
  minLetterMm: 15,                     // [default] as acrylic letters of the sign constructor
  maxLetterMm: 300,                    // [default]
  maxLines: 20,                        // [default] a menu board
  maxLineChars: 60,
  maxTailChars: 20,
  maxPieceWidthMm: 1950,               // laser bed 1400 × 2000 mm, with a margin
  maxPieceHeightMm: 1350,
  barShare: 0.1,                       // [default] as on Денис's photos
  barMinMm: 3,
  barMaxMm: 12,
  barOverlapShare: 0.4,
  barExtendShare: 0.6,
  tailGapShare: 0.6,
  rowGapShare: 0.55,
};
