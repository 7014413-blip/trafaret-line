// Millimetres to centimetres without the unit, in the page language: "30,5" in Ukrainian and
// Russian (the same text as cmText), "30.5" in English. Shared with the server: relative imports.

import type { Locale } from "../../types/customizer";
import { cmText } from "../format";

export function localCm(mm: number, locale: Locale = "uk"): string {
  if (locale !== "en") return cmText(mm);
  return (Math.round(mm) / 10).toLocaleString("en-US", { maximumFractionDigits: 1 });
}
