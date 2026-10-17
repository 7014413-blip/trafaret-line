// Plural form of a word in the page language. Ukrainian and Russian pick one of three forms
// (1 розмір, 2 розміри, 5 розмірів); English uses the first form for one and the third
// otherwise (1 size, 21 sizes), so the dictionaries keep three forms for every language.

import type { Locale } from "../../types/customizer";
import { pluralUk } from "./plural-uk";

export function plural(locale: Locale, count: number, forms: readonly [one: string, few: string, many: string]): string {
  if (locale === "en") return Math.abs(count) === 1 ? forms[0] : forms[2];
  return pluralUk(count, forms);
}
