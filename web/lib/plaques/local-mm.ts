// Millimetres without the unit, in the page language, to one decimal: "2,5" in Ukrainian and
// Russian, "2.5" in English. Shared with the server: relative imports.

import type { Locale } from "../../types/customizer";

export function localMm(mm: number, locale: Locale = "uk"): string {
  return mm.toLocaleString(locale === "en" ? "en-US" : "uk-UA", { maximumFractionDigits: 1 });
}
