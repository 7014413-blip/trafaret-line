// Languages the site serves and how each is written in URLs and in hreflang. Ukrainian has no
// prefix. English shows only the pages listed in data/knowledge_base/paths_en.json.

import type { Locale } from "../../types/customizer";

export const DEFAULT_LOCALE: Locale = "uk";

/** Languages with pages on the site, in switcher order. */
export const SITE_LOCALES: readonly Locale[] = ["uk", "ru", "en"];

/** hreflang / og:locale of each language: the shop sells in Ukraine. */
export const LOCALE_TAGS: Record<Locale, { hreflang: string; og: string; html: string }> = {
  uk: { hreflang: "uk-UA", og: "uk_UA", html: "uk" },
  ru: { hreflang: "ru-UA", og: "ru_UA", html: "ru" },
  en: { hreflang: "en-UA", og: "en_US", html: "en" },
};

export function isSiteLocale(value: string | undefined): value is Locale {
  return !!value && (SITE_LOCALES as readonly string[]).includes(value);
}

/** The [lang] segment as a language; anything unknown is Ukrainian. */
export function localeOf(value: string | undefined): Locale {
  return isSiteLocale(value) ? value : DEFAULT_LOCALE;
}
