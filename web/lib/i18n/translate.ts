// Picks the texts of the page language from a dictionary.

import type { Locale } from "../../types/customizer";
import type { Dictionary } from "../../types/i18n";

export function tr<T>(dictionary: Dictionary<T>, locale: Locale): T {
  return dictionary[locale];
}
