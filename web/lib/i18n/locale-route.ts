// What the middleware does with a request path: Ukrainian pages are served from the [lang]
// segment "uk" without showing it, "/uk/…" redirects to the address without the prefix,
// Russian passes with its prefix, and an English address ("/en/signs") is served from the
// Ukrainian route ("/en/vyvisky"). An English address of no page goes to the 404 page, so
// an untranslated page never shows under "/en/". Files, API routes and Next.js internals
// are not touched.

import { ukrainianPath } from "./english-paths";
import { DEFAULT_LOCALE, SITE_LOCALES } from "./locales";

export type LocaleRoute =
  | { action: "pass" }
  | { action: "rewrite"; path: string }
  | { action: "redirect"; path: string };

const NOT_PAGES = /^\/(api|feeds|_next|pay-return)(\/|$)|^\/(robots\.txt|sitemap\.xml)$/;
const FILE = /\/[^/]+\.[a-z0-9]+$/i;
/** A path no page has: the [...rest] route answers it with the 404 page. */
const MISSING = "/__no-english-version";

export function localeRoute(pathname: string): LocaleRoute {
  if (NOT_PAGES.test(pathname) || FILE.test(pathname)) return { action: "pass" };
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    return { action: "redirect", path: pathname.slice(DEFAULT_LOCALE.length + 1) || "/" };
  }
  for (const locale of SITE_LOCALES) {
    if (pathname !== `/${locale}` && !pathname.startsWith(`/${locale}/`)) continue;
    if (locale !== "en") return { action: "pass" };
    const english = pathname.slice(locale.length + 1).replace(/\/+$/, "") || "/";
    const route = ukrainianPath(english);
    return { action: "rewrite", path: route === null ? `/en${MISSING}` : route === "/" ? "/en" : `/en${route}` };
  }
  return { action: "rewrite", path: `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}` };
}
