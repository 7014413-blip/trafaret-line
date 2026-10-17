// Picks the texts of the page language from a dictionary; a language without its own texts
// yet (English) gets the Ukrainian ones.

import type { Locale } from "../../types/customizer";
import type { Dictionary } from "../../types/i18n";

export function tr<T>(dictionary: Dictionary<T>, locale: Locale): T {
  return dictionary[locale] ?? dictionary.uk;
}
