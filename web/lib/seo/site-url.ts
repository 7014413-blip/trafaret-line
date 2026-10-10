// Public address of the storefront for canonical links, Open Graph, robots.txt and the
// sitemap. NEXT_PUBLIC_SITE_URL overrides it (a staging copy must not claim the real domain).

import { SITE } from "../../data/site";

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || `https://${SITE.domain}`).replace(/\/$/, "");
}

/** Absolute URL for a site path ("/oferta" → "https://trafaret-line.com.ua/oferta"). */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
