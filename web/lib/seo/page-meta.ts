// Page metadata with the canonical link and Open Graph tags filled from one place.
// Next.js does not copy a page title into og:title, so every public page builds its
// metadata here. A page translated into every site language passes its `locale`: it then
// links itself as canonical and lists its language versions (hreflang). A page without a
// translation yet shows Ukrainian under /ru/ too, so its canonical stays the Ukrainian page.

import type { Metadata } from "next";
import type { Locale } from "../../types/customizer";
import { DEFAULT_LOCALE, LOCALE_TAGS, SITE_LOCALES } from "../i18n/locales";
import { localePath } from "../i18n/locale-path";

export interface PageMetaInput {
  title: string;
  description: string;
  /** Ukrainian site path without a trailing slash: "/oferta", "/p/mandala". */
  path: string;
  /** Absolute or site-relative image URL for social previews. */
  image?: string | null;
  /** Use the title as is, without the « · Trafaret Line» suffix. */
  absoluteTitle?: boolean;
  noindex?: boolean;
  /** Language of a translated page; leave out for pages that are only in Ukrainian. */
  locale?: Locale;
}

/** hreflang → path of every language version of a translated page, plus x-default (Ukrainian). */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of SITE_LOCALES) languages[LOCALE_TAGS[locale].hreflang] = localePath(locale, path);
  languages["x-default"] = path;
  return languages;
}

export function pageMeta({ title, description, path, image, absoluteTitle, noindex, locale }: PageMetaInput): Metadata {
  const canonical = locale ? localePath(locale, path) : path;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: locale ? { canonical, languages: languageAlternates(path) } : { canonical },
    openGraph: {
      type: "website",
      locale: LOCALE_TAGS[locale ?? DEFAULT_LOCALE].og,
      siteName: "Trafaret Line",
      title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
