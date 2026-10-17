// Units and number formats every page writes next to numbers: "20 см" / "20 cm", "0,5 мм" /
// "0.5 mm", "3 шт." / "3 pcs". Shared with the server, so only relative imports.

import type { Locale } from "../../../types/customizer";
import type { Dictionary } from "../../../types/i18n";
import { tr } from "../translate";

export interface UnitTexts {
  cm: string;
  mm: string;
  m: string;
  pcs: string;
  /** Decimal separator: a comma in Ukrainian and Russian, a dot in English. */
  decimal: string;
}

export const UNITS: Dictionary<UnitTexts> = {
  uk: { cm: "см", mm: "мм", m: "м", pcs: "шт.", decimal: "," },
  ru: { cm: "см", mm: "мм", m: "м", pcs: "шт.", decimal: "," },
  en: { cm: "cm", mm: "mm", m: "m", pcs: "pcs", decimal: "." },
};

/** Units of the page language. */
export function units(locale: Locale): UnitTexts {
  return tr(UNITS, locale);
}

/** A number with the decimal separator of the language: 0.5 → "0,5" or "0.5". */
export function decimal(value: number | string, locale: Locale): string {
  return String(value).replace(".", units(locale).decimal);
}
