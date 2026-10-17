// Catalogue search: /poshuk?q=мандала. Results come from the Medusa Store API full-text
// search; the page is not indexed (endless query combinations).

import type { Metadata } from "next";
import Link from "@/components/i18n/LocaleLink";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { CategoryView } from "@/components/catalog/CategoryView";
import { searchProducts } from "@/services/medusa-store";
import { pageMeta } from "@/lib/seo/page-meta";
import type { CatalogCardLite } from "@/types/catalog";
import { CATALOG } from "@/lib/i18n/dictionaries/catalog";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import type { LangParams } from "@/types/i18n";

type Props = { params: Promise<LangParams>; searchParams: Promise<{ q?: string | string[] }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = localeOf((await params).lang);
  const t = tr(CATALOG, locale);
  return pageMeta({ title: t.searchMetaTitle, description: t.searchMetaDescription, path: "/poshuk", noindex: true, locale });
}

export default async function SearchPage({ params, searchParams }: Props) {
  const locale = localeOf((await params).lang);
  const t = tr(CATALOG, locale);
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 100);
  let products: CatalogCardLite[] = [];
  let failed = false;
  if (query.length >= 2) {
    try {
      products = await searchProducts(query, 60, locale);
    } catch (error) {
      console.error("[search] catalogue is not available", error);
      failed = true;
    }
  }

  return (
    <div className="pb-[76px] lg:pb-0">
      <TrustBar />
      <SiteHeader initialQuery={query} />
      <DirectionTabs />
      <main className="mx-auto max-w-[1320px] px-4 py-6 lg:px-8">
        <h1 className="m-0 mb-4 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold">
          {query ? t.searchFor(query) : t.searchTitle}
        </h1>
        {failed && <p role="alert" className="m-0 mb-4 text-[var(--danger)]">{t.searchFailed}</p>}
        {query.length < 2 && <p className="m-0 text-[var(--muted)]">{t.searchTooShort}</p>}
        {query.length >= 2 && !failed && products.length === 0 && (
          <div className="grid justify-items-start gap-3">
            <p className="m-0 text-lg">{t.searchNothing(query)}</p>
            <p className="m-0 text-[var(--muted)]">{t.searchNothingHint}</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/catalog" className="rounded-full bg-[var(--buy)] px-5 py-2.5 font-bold text-[var(--buy-fg)]">{t.toCatalog}</Link>
              <Link href="/konstruktor" className="rounded-full px-5 py-2.5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">{t.ownText}</Link>
            </div>
          </div>
        )}
        {products.length > 0 && <CategoryView products={products} subcategories={[]} />}
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
