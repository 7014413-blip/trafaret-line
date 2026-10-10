// Pointer sign settings (admin). Fixed sizes and prices are Денис's (2026-10-10):
// 25×10 cm 450 UAH, 30×12 cm 600 UAH, 35×15 cm 890 UAH per piece, every colour included.
// [default] values were chosen by Claude on 2026-10-10 and are admin settings:
// a custom size costs the approved sign rate 18 000 UAH/m² of its bounding box, never below
// 450 UAH, never above the next larger fixed size and never below a smaller one it contains.

import type { PointerSignConfig } from "../../types/pointer-sign";

export const DEFAULT_POINTER_SIGN_CONFIG: PointerSignConfig = {
  presets: [
    { code: "25x10", widthMm: 250, heightMm: 100, price: 450 },
    { code: "30x12", widthMm: 300, heightMm: 120, price: 600 },
    { code: "35x15", widthMm: 350, heightMm: 150, price: 890 },
  ],
  customRatePerM2: 18_000,
  minPrice: 450,
  roundTo: 10,
  minWidthMm: 150,                     // [default]
  maxWidthMm: 1_000,                   // [default] larger pointers go to the sign constructor
  minHeightMm: 60,                     // [default]
  maxHeightMm: 400,                    // [default]
  maxHeightToWidth: 0.6,               // [default]
  maxLines: 4,
  maxLineChars: 40,
  absoluteMinLetterMm: 6,              // [default] thinner letters break off the overlay
};
