// Customer-facing number formats. Prices in whole hryvnias. Ukrainian and Russian pages group
// digits the Ukrainian way ("1 285", "30,5"), English pages the English way ("1,285", "30.5").
// Shared with the server, so only relative imports.

import type { Locale } from "../types/customizer";
import { units } from "./i18n/dictionaries/units";

const NUMBER_TAG: Record<Locale, string> = { uk: "uk-UA", ru: "uk-UA", en: "en-GB" };

/** "1 285 ₴" (uk, ru) / "1,285 ₴" (en). */
export function formatUAH(value: number, locale: Locale = "uk"): string {
  return `${value.toLocaleString(NUMBER_TAG[locale])} ₴`;
}

/** "1 285,00" for invoices and receipts. */
export function formatMoney2(value: number): string {
  return value.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Millimetres to centimetres without the unit: "30" / "30,5" (uk, ru) / "30.5" (en). */
export function cmText(mm: number, locale: Locale = "uk"): string {
  return (Math.round(mm) / 10).toLocaleString(NUMBER_TAG[locale], { maximumFractionDigits: 1 });
}

/** Millimetres to "30 см" / "30,5 см" (uk, ru) / "30.5 cm" (en). */
export function formatCm(mm: number, locale: Locale = "uk"): string {
  return `${cmText(mm, locale)} ${units(locale).cm}`;
}
