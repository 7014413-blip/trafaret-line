// Site paths per language: "/catalog" in Ukrainian is "/ru/catalog" in Russian. English has
// its own slugs ("/vyvisky" → "/en/signs", lib/i18n/english-paths.ts); a page without an
// English version keeps its Ukrainian address. Paths that are not pages (API, files, anchors,
// other sites) are left as they are.

import type { Locale } from "../../types/customizer";
import { englishPath, ukrainianPath } from "./english-paths";
import { DEFAULT_LOCALE, SITE_LOCALES } from "./locales";

const NOT_PAGES = /^\/(api|feeds|_next|pay-return)(\/|$)|^\/[^?#]*\.[a-z0-9]+([?#]|$)/i;

/** "/p/x?size=2#top" → "/p/x", "?size=2#top"; a trailing slash is dropped. */
function splitTail(path: string): { pathname: string; tail: string } {
  const at = path.search(/[?#]/);
  const pathname = at < 0 ? path : path.slice(0, at);
  return { pathname: pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname, tail: at < 0 ? "" : path.slice(at) };
}

/** True when the page at this Ukrainian path exists in the language. */
export function hasLocaleVersion(locale: Locale, path: string): boolean {
  return locale !== "en" || englishPath(splitTail(path).pathname) !== null;
}

/** The path of a Ukrainian page in the given language. */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//") || NOT_PAGES.test(path)) return path;
  if (path === `/${locale}` || path.startsWith(`/${locale}/`) || path.startsWith(`/${locale}?`)) return path;
  if (locale === "en") {
    const { pathname, tail } = splitTail(path);
    const english = englishPath(pathname);
    if (english === null) return path;
    return (english === "/" ? "/en" : `/en${english}`) + tail;
  }
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The language and the Ukrainian path of a site path: "/ru/catalog" → ru, "/catalog"; "/en/signs" → en, "/vyvisky". */
export function splitLocalePath(path: string): { locale: Locale; path: string } {
  for (const locale of SITE_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    const rest = path === `/${locale}` ? "/" : path.startsWith(`/${locale}/`) ? path.slice(locale.length + 1) : null;
    if (rest === null) continue;
    return { locale, path: locale === "en" ? ukrainianPath(splitTail(rest).pathname) ?? rest : rest };
  }
  return { locale: DEFAULT_LOCALE, path };
}
