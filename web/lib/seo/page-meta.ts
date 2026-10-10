// Page metadata with the canonical link and Open Graph tags filled from one place.
// Next.js does not copy a page title into og:title, so every public page builds its
// metadata here. Only the Ukrainian version exists, so there are no hreflang alternates.

import type { Metadata } from "next";

export interface PageMetaInput {
  title: string;
  description: string;
  /** Site path without a trailing slash: "/oferta", "/p/mandala". */
  path: string;
  /** Absolute or site-relative image URL for social previews. */
  image?: string | null;
  /** Use the title as is, without the « · Trafaret Line» suffix. */
  absoluteTitle?: boolean;
  noindex?: boolean;
}

export function pageMeta({ title, description, path, image, absoluteTitle, noindex }: PageMetaInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "uk_UA",
      siteName: "Trafaret Line",
      title,
      description,
      url: path,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
