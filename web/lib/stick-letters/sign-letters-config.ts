// Separate self-adhesive letters for ads, inscriptions and signs (Денис 2026-10-11): capital and
// small letters cut from 3 mm acrylic, every letter its own piece with tape on the back, 2–20 cm
// high. Black or white 6500 UAH per m², mirror silver, rose gold or gold 10 200 UAH per m², each
// letter by its outer box (a letter 2 × 2 cm = 0.0004 m²). [default] Claude 2026-10-11: one order
// at least 150 UAH (the site minimum), rounded up to 10 UAH; no stencil (letters are placed by eye
// or along a line).

import type { StickLettersConfig } from "../../types/stick-letters";

export const SIGN_LETTERS_CONFIG: StickLettersConfig = {
  product: "sign-letters",
  title: { uk: "Самоклейні літери для вивісок і написів", ru: "Самоклеящиеся буквы для вывесок и надписей", en: "Self-adhesive letters for signs and lettering" },
  ratePerM2: 6500,                     // Денис: black and white
  rateNoAdhesivePerM2: null,           // always with self-adhesive
  materialRates: {
    black: 6500,                       // Денис
    white: 6500,                       // Денис
    "mirror-silver": 10200,            // Денис
    "mirror-rose": 10200,              // Денис
    "mirror-gold": 10200,              // Денис
  },
  materialIds: ["black", "white", "mirror-gold", "mirror-silver", "mirror-rose"],
  caseChoice: true,
  stencil: false,
  joinable: false,
  minPrice: 150,                       // [default]
  roundTo: 10,
  thicknessMm: 3,
  minLetterMm: 20,                     // Денис: from 2 cm
  maxLetterMm: 200,                    // Денис: up to 20 cm
  maxLines: 4,                         // [default]
  maxLineChars: 40,
  rowGapShare: 0.35,
  touchShare: 0.02,
  stencilMarginMm: 15,
  maxPieceWidthMm: 1950,
  maxPieceHeightMm: 1350,
};
