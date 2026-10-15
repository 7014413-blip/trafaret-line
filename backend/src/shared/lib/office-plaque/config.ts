// Office plaque settings (admin). Денис 2026-10-10: 21×6 cm, black or white acrylic base,
// mirror plate (gold, silver, bronze gold, satin silver) with engraving, 3M tape, 220 UAH.
// [default] Claude 2026-10-10: other sizes cost 220 UAH × area / 126 cm², rounded up to 10 UAH,
// never below 220 UAH; the plate sits 4 mm inside the base edge.

import type { OfficePlaqueConfig } from "../../types/office-plaque";

export const DEFAULT_OFFICE_PLAQUE_CONFIG: OfficePlaqueConfig = {
  referenceWidthMm: 210,
  referenceHeightMm: 60,
  referencePrice: 220,
  minPrice: 220,
  roundTo: 10,
  presets: [
    { code: "21x6", widthMm: 210, heightMm: 60 },      // Денис
    { code: "25x8", widthMm: 250, heightMm: 80 },      // [default]
    { code: "30x10", widthMm: 300, heightMm: 100 },    // [default]
    { code: "30x20", widthMm: 300, heightMm: 200 },    // [default] door plate
  ],
  borderMm: 4,                         // [default]
  plateMarginMm: 5,                    // [default]
  minWidthMm: 100,                     // [default]
  maxWidthMm: 600,                     // [default]
  minHeightMm: 40,                     // [default]
  maxHeightMm: 400,                    // [default]
  maxLines: 3,
  maxLineChars: 40,
  absoluteMinLetterMm: 3,              // [default]
  smallLetterMm: 5,                    // [default]
};
