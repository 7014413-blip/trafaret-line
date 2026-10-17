// /robots.txt: everything public is open; checkout, invoices, the thank-you page and the
// API stay out of search. A staging copy (NEXT_PUBLIC_SITE_URL other than the real domain)
// is closed entirely so it never competes with the shop, subdomains like test. included.

import type { MetadataRoute } from "next";
import { isProductionSite } from "@/lib/seo/production-site";
import { siteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  if (!isProductionSite(base)) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/checkout", "/rakhunok/", "/thank-you", "/pay-return", "/kabinet", "/vidguk/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
