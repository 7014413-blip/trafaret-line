// Catalogue search: /poshuk?q=мандала. Results come from the Medusa Store API full-text
// search; the page is not indexed (endless query combinations).

import type { Metadata } from "next";
import Link from "@/components/i18n/LocaleLink";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { CategoryView } from "@/components/catalog/CategoryView";
import { searchProducts } from "@/services/medusa-store";
import { pageMeta } from "@/lib/seo/page-meta";
import type { CatalogCardLite } from "@/types/catalog";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Пошук трафаретів",
  description: "Пошук по каталогу трафаретів і заготовок Trafaret Line.",
  path: "/poshuk",
  noindex: true,
});

export default async function SearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw ?? "").trim().slice(0, 100);
  let products: CatalogCardLite[] = [];
  let failed = false;
  if (query.length >= 2) {
    try {
      products = await searchProducts(query);
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
          {query ? <>Пошук: «{query}»</> : "Пошук по каталогу"}
        </h1>
        {failed && <p role="alert" className="m-0 mb-4 text-[var(--danger)]">Каталог зараз недоступний. Спробуйте ще раз за хвилину.</p>}
        {query.length < 2 && <p className="m-0 text-[var(--muted)]">Введіть щонайменше 2 літери, наприклад «мандала» або «цифри».</p>}
        {query.length >= 2 && !failed && products.length === 0 && (
          <div className="grid justify-items-start gap-3">
            <p className="m-0 text-lg">За запитом «{query}» нічого не знайшли.</p>
            <p className="m-0 text-[var(--muted)]">Спробуйте інше слово або зробіть свій трафарет з текстом.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/catalog" className="rounded-full bg-[var(--buy)] px-5 py-2.5 font-bold text-[var(--buy-fg)]">До каталогу</Link>
              <Link href="/konstruktor" className="rounded-full px-5 py-2.5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">Свій напис</Link>
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
