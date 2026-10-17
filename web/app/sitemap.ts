// /sitemap.xml: static pages, every catalogue category and every published product from
// Medusa. Rebuilt hourly; when the shop is offline the static part is still served.
// Pages already translated (home, catalogue, categories, products) are listed in every site
// language, each with its hreflang alternates; the rest only in Ukrainian for now.

import type { MetadataRoute } from "next";
import { listCategories, listProductHandles } from "@/services/medusa-store";
import { absoluteUrl } from "@/lib/seo/site-url";
import { languageAlternates } from "@/lib/seo/page-meta";
import { SITE_LOCALES } from "@/lib/i18n/locales";
import { localePath } from "@/lib/i18n/locale-path";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/** Translated pages: one entry per language, each listing all language versions. */
const TRANSLATED_PAGES: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/catalog", priority: 0.9, changeFrequency: "daily" },
];

const STATIC_PAGES: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: "/konstruktor", priority: 0.9, changeFrequency: "monthly" },
  { path: "/konstruktor/polotno", priority: 0.7, changeFrequency: "monthly" },
  { path: "/na-zamovlennia", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vyvisky", priority: 0.7, changeFrequency: "monthly" },
  { path: "/zahotovky", priority: 0.8, changeFrequency: "monthly" },
  { path: "/vyvisky/vkazivnyky", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vyvisky/ofisni-tablychky", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vyvisky/napysy-na-plantsi", priority: 0.7, changeFrequency: "monthly" },
  { path: "/konstruktor/inicialy-na-tort", priority: 0.7, changeFrequency: "monthly" },
  { path: "/konstruktor/samoklejni-litery", priority: 0.7, changeFrequency: "monthly" },
  { path: "/konstruktor/akrylovi-tsyfry-i-litery", priority: 0.7, changeFrequency: "monthly" },
  { path: "/konstruktor/samoklejni-litery-dlia-vyvisok", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vyvisky/tablychky-poverkh", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vyvisky/tablychky-na-dveri", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vyvisky/nomerky", priority: 0.7, changeFrequency: "monthly" },
  { path: "/dostavka-i-oplata", priority: 0.5, changeFrequency: "monthly" },
  { path: "/povernennia", priority: 0.4, changeFrequency: "yearly" },
  { path: "/pro-nas", priority: 0.4, changeFrequency: "yearly" },
  { path: "/kontakty", priority: 0.5, changeFrequency: "yearly" },
  { path: "/vidguky", priority: 0.5, changeFrequency: "weekly" },
  { path: "/oferta", priority: 0.2, changeFrequency: "yearly" },
  { path: "/polityka-konfidentsiinosti", priority: 0.2, changeFrequency: "yearly" },
];

/** Entries of a translated page in every site language. */
function inEveryLanguage(path: string, entry: Omit<Entry, "url" | "alternates">): Entry[] {
  const languages = Object.fromEntries(Object.entries(languageAlternates(path)).map(([tag, href]) => [tag, absoluteUrl(href)]));
  return SITE_LOCALES.map((locale) => ({ ...entry, url: absoluteUrl(localePath(locale, path)), alternates: { languages } }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    ...TRANSLATED_PAGES.flatMap((page) => inEveryLanguage(page.path, { changeFrequency: page.changeFrequency, priority: page.priority })),
    ...STATIC_PAGES.map((page) => ({ url: absoluteUrl(page.path), changeFrequency: page.changeFrequency, priority: page.priority })),
  ];
  try {
    const [{ all }, products] = await Promise.all([listCategories(), listProductHandles()]);
    for (const category of all) {
      entries.push(...inEveryLanguage(category.path, { changeFrequency: "weekly", priority: category.parentHandle ? 0.7 : 0.8 }));
    }
    for (const product of products) {
      entries.push(...inEveryLanguage(`/p/${product.handle}`, {
        lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("[sitemap] catalogue is not available", error);
  }
  return entries;
}
