// Category page (server component) for /<section>/ and /<section>/<sub>/: texts and SEO
// from the category metadata, products from Medusa, subcategories as chips.

import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { CategoryView } from "@/components/catalog/CategoryView";
import { categoryByPath, listCategories, listCategoryCards } from "@/services/medusa-store";
import { pageMeta } from "@/lib/seo/page-meta";
import { toCategoryLink } from "@/lib/catalog/card-lite";
import { siteUrl } from "@/lib/seo/site-url";
import { listItems } from "@/lib/analytics/analytics-item";
import { TrackEvent } from "@/components/analytics/TrackEvent";

const BASE = siteUrl();

export async function CategoryPage({ segments }: { segments: string[] }) {
  const category = await categoryByPath(segments);
  if (!category) notFound();
  const { all } = await listCategories();
  const parent = category.parentHandle ? all.find((c) => c.handle === category.parentHandle) ?? null : null;
  const ids = [category.id, ...category.children.map((c) => c.id)];
  const products = await listCategoryCards(ids);

  const crumbs = [
    { name: "Головна", path: "/" },
    ...(parent ? [{ name: parent.name, path: parent.path }] : []),
    { name: category.name, path: category.path },
  ];
  const ld = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${BASE}${c.path}` })),
  };

  return (
    <div className="pb-[76px] lg:pb-0">
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <main className="mx-auto max-w-[1320px] px-4 py-5 lg:px-8">
        <nav aria-label="Хлібні крихти" className="mb-3 flex flex-wrap gap-1.5 text-[13px] text-[var(--muted)]">
          {crumbs.slice(0, -1).map((c) => <span key={c.path}><Link href={c.path} className="hover:text-[var(--ink)]">{c.name}</Link> ›</span>)}
          <span>{category.name}</span>
        </nav>
        <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,36px)] font-bold leading-tight [text-wrap:balance]">{category.seo.h1 ?? category.name}</h1>
        {category.intro && <p className="mt-2 mb-5 max-w-[75ch] text-[var(--muted)]">{category.intro}</p>}

        {category.children.length > 0 && (
          <div className="mb-6 flex gap-2.5 overflow-x-auto [scrollbar-width:none]">
            {category.children.map((s) => (
              <Link key={s.handle} href={s.path} className="flex-none rounded-full bg-[var(--surface)] px-4 py-2 text-[15px] font-medium hover:bg-[var(--line)]">{s.name}</Link>
            ))}
          </div>
        )}

        <CategoryView products={products} subcategories={toCategoryLink(category).children} />
        {products.length > 0 && <TrackEvent name="view_item_list" params={{ item_list_name: category.name, items: listItems(products, category.name) }} />}

        {(category.bodyHtml || category.faq.length > 0) && (
          <section className="mt-10 grid max-w-[80ch] gap-2.5">
            {category.bodyHtml && <div className="text-[var(--muted)] [&_h2]:mt-4 [&_h2]:mb-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--ink)]" dangerouslySetInnerHTML={{ __html: category.bodyHtml }} />}
            {category.faq.map(({ q, a }) => (
              <details key={q} className="border-t border-[var(--line)] py-2.5">
                <summary className="cursor-pointer font-semibold">{q}</summary>
                <p className="mt-2 mb-0">{a}</p>
              </details>
            ))}
            {category.faq.length > 0 && (
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: category.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }} />
            )}
          </section>
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

/** Metadata of a category page. */
export async function categoryMetadata(segments: string[]) {
  const category = await categoryByPath(segments);
  if (!category) return {};
  // SEO titles from the catalogue already end with "| Trafaret Line": no site suffix.
  return pageMeta({ title: category.seo.title, absoluteTitle: true, description: category.seo.description, path: category.path, image: category.image });
}
