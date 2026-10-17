// What the catalogue shows in a language. Ukrainian and Russian show everything; English only
// the categories and products that have an English version (data/knowledge_base/paths_en.json),
// so an English page never lists a card that leads to Ukrainian text.

import type { CatalogCategory } from "../../types/catalog";
import type { Locale } from "../../types/customizer";
import { hasLocaleVersion } from "../i18n/locale-path";

/** Categories with a version in the language, their children filtered the same way. */
export function categoriesInLanguage(categories: CatalogCategory[], locale: Locale): CatalogCategory[] {
  return categories
    .filter((c) => hasLocaleVersion(locale, c.path))
    .map((c) => ({ ...c, children: categoriesInLanguage(c.children, locale) }));
}

/** Products (anything with a handle) with a version in the language. */
export function productsInLanguage<T extends { handle: string }>(products: T[], locale: Locale): T[] {
  return products.filter((p) => hasLocaleVersion(locale, `/p/${p.handle}`));
}
