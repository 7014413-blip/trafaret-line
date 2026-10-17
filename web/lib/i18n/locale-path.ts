// Site paths per language: "/catalog" in Ukrainian is "/ru/catalog" in Russian. Paths that are
// not pages (API, files, anchors, other sites) are left as they are.

import type { Locale } from "../../types/customizer";
import { DEFAULT_LOCALE, SITE_LOCALES } from "./locales";

const NOT_PAGES = /^\/(api|feeds|_next|pay-return)(\/|$)|^\/[^?#]*\.[a-z0-9]+([?#]|$)/i;

/** The path of a Ukrainian page in the given language. */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//") || NOT_PAGES.test(path)) return path;
  if (path === `/${locale}` || path.startsWith(`/${locale}/`) || path.startsWith(`/${locale}?`)) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The language and the Ukrainian path of a site path: "/ru/catalog" → ru, "/catalog". */
export function splitLocalePath(path: string): { locale: Locale; path: string } {
  for (const locale of SITE_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    if (path === `/${locale}`) return { locale, path: "/" };
    if (path.startsWith(`/${locale}/`)) return { locale, path: path.slice(locale.length + 1) };
  }
  return { locale: DEFAULT_LOCALE, path };
}
