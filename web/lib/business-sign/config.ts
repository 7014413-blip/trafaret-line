// Settings of the business sign constructor. Price: lib/calculators/signage.ts (17 000 UAH/m²,
// Денис 2026-10-10). Sizes and proportions below are [default], chosen by Claude on 2026-10-10:
// round signs 30…80 cm as is usual for salon and office signs.

import type { BusinessSignConfig } from "../../types/business-sign";

export const DEFAULT_BUSINESS_SIGN_CONFIG: BusinessSignConfig = {
  title: { uk: "Вивіска з логотипом", ru: "Вывеска с логотипом", en: "Business sign with a logo" },
  presets: {
    circle: [300, 400, 500, 600, 700, 800].map((d) => ({ widthMm: d, heightMm: d })),
    square: [300, 400, 500, 600].map((d) => ({ widthMm: d, heightMm: d })),
    rect: [{ widthMm: 400, heightMm: 200 }, { widthMm: 600, heightMm: 300 }, { widthMm: 800, heightMm: 400 }, { widthMm: 1000, heightMm: 500 }],
    rounded: [{ widthMm: 400, heightMm: 200 }, { widthMm: 600, heightMm: 300 }, { widthMm: 800, heightMm: 400 }, { widthMm: 1000, heightMm: 500 }],
    arrow: [{ widthMm: 500, heightMm: 200 }, { widthMm: 700, heightMm: 250 }, { widthMm: 900, heightMm: 300 }],
    pointer: [{ widthMm: 500, heightMm: 150 }, { widthMm: 700, heightMm: 200 }, { widthMm: 900, heightMm: 250 }],
  },
  minSideMm: 100,
  maxSideMm: 3000,
  maxLines: 4,
  maxLineChars: 40,
  maxArcChars: 40,
  frameInsetShare: 0.035,
  frameInsetMinMm: 6,
  frameWidthShare: 0.012,
  frameWidthMinMm: 3,
  paddingShare: 0.05,
  arcBandShare: 0.2,
  arcMaxSpanDeg: 150,
  arcCapShare: 0.6,
  logoGapShare: 0.06,
  minLetterMirrorMm: 12,
  minLetterMm: 10,
};
