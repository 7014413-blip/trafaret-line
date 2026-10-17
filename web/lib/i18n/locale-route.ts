// What the middleware does with a request path: Ukrainian pages are served from the [lang]
// segment "uk" without showing it, "/uk/…" redirects to the address without the prefix, other
// languages pass with their prefix. Files, API routes and Next.js internals are not touched.

import { DEFAULT_LOCALE, SITE_LOCALES } from "./locales";

export type LocaleRoute =
  | { action: "pass" }
  | { action: "rewrite"; path: string }
  | { action: "redirect"; path: string };

const NOT_PAGES = /^\/(api|feeds|_next|pay-return)(\/|$)|^\/(robots\.txt|sitemap\.xml)$/;
const FILE = /\/[^/]+\.[a-z0-9]+$/i;

export function localeRoute(pathname: string): LocaleRoute {
  if (NOT_PAGES.test(pathname) || FILE.test(pathname)) return { action: "pass" };
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    return { action: "redirect", path: pathname.slice(DEFAULT_LOCALE.length + 1) || "/" };
  }
  for (const locale of SITE_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return { action: "pass" };
  }
  return { action: "rewrite", path: `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}` };
}
