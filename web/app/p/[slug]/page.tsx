import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { Gallery, ProductBuyBox } from "@/components/catalog/ProductBuyBox";
import { LazyHoleProductView, LazyMonogramProductView } from "@/components/catalog/LazyProductViews";
import { listCategories, productByHandle, productsByHandles } from "@/services/medusa-store";
import { listReviews } from "@/services/medusa-reviews";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { reviewJsonLd } from "@/lib/reviews/review-json-ld";
import { jsonLdText } from "@/lib/seo/json-ld";
import { schemaAvailability } from "@/lib/seo/schema-availability";
import { variantItem } from "@/lib/analytics/analytics-item";
import { TrackEvent } from "@/components/analytics/TrackEvent";
import { formatUAH } from "@/lib/format";
import { pageMeta } from "@/lib/seo/page-meta";
import { siteUrl } from "@/lib/seo/site-url";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

const BASE = siteUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await productByHandle((await params).slug);
  if (!p) return {};
  // SEO titles from the catalogue already end with "| Trafaret Line": no site suffix.
  return pageMeta({ title: p.seo.title, absoluteTitle: true, description: p.seo.description, path: `/p/${p.handle}`, image: p.images[0]?.url ?? null });
}

export default async function ProductPage({ params }: Props) {
  const p = await productByHandle((await params).slug);
  if (!p) notFound();
  const { all } = await listCategories();
  const category = all.find((c) => c.handle === p.categoryHandles[0]) ?? null;
  const parent = category?.parentHandle ? all.find((c) => c.handle === category.parentHandle) ?? null : null;
  const [related, reviews] = await Promise.all([productsByHandles(p.relatedHandles.slice(0, 8)), listReviews({ product: p.handle, limit: 10 })]);

  // ProductGroup with size × material variants (ТЗ §18). Ratings only from published reviews.
  const ld = {
    "@context": "https://schema.org", "@type": "ProductGroup", name: p.title, productGroupID: p.handle, description: p.seo.description,
    brand: { "@type": "Brand", name: "Trafaret Line" }, image: p.images.map((i) => i.url), variesBy: ["https://schema.org/size", "https://schema.org/material"],
    hasVariant: p.variants.map((v) => ({
      "@type": "Product", name: `${p.title}, ${v.sizeLabel}, ${v.materialLabel}`, sku: v.sku ?? v.id, size: v.sizeLabel, material: v.materialLabel,
      offers: { "@type": "Offer", price: v.price, priceCurrency: "UAH", availability: schemaAvailability(p.availability), itemCondition: "https://schema.org/NewCondition", url: `${BASE}/p/${p.handle}` },
    })),
    ...reviewJsonLd(reviews),
  };

  // «view_item» with the cheapest variant: the price the card in the catalogue showed.
  const cheapest = [...p.variants].sort((a, b) => a.price - b.price)[0];
  const viewed = cheapest ? variantItem(p, cheapest) : null;

  const sections: { title: string; html: string }[] = [
    { title: "Опис", html: p.descriptionHtml },
    ...(p.features.length ? [{ title: "Коротко", html: `<ul>${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>` }] : []),
    ...p.blocks.map((b) => ({ title: b.title, html: b.html })),
  ];

  return (
    <div className="pb-[130px] lg:pb-0">
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <main className="mx-auto max-w-[1320px] px-4 py-5 lg:px-8">
        <nav aria-label="Хлібні крихти" className="mb-4 flex flex-wrap gap-1.5 text-[13px] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--ink)]">Головна</Link>›
          {parent && <><Link href={parent.path} className="hover:text-[var(--ink)]">{parent.name}</Link>›</>}
          {category && <><Link href={category.path} className="hover:text-[var(--ink)]">{category.name}</Link>›</>}
          <span>{p.title}</span>
        </nav>
        {p.hole ? (
          <LazyHoleProductView p={p} rules={p.hole} />
        ) : p.monogram ? (
          <LazyMonogramProductView p={p} />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <Gallery images={p.images} title={p.title} />
            <ProductBuyBox p={p} />
          </div>
        )}
        <section className="mt-10 grid max-w-[860px] gap-0">
          {sections.map((s, i) => (
            <details key={s.title + i} open={i < 2} className="border-t border-[var(--line)] py-3">
              <summary className="cursor-pointer text-lg font-semibold">{s.title}</summary>
              <div className="mt-2 [&_li]:ml-5 [&_li]:list-disc [&_p]:my-2" dangerouslySetInnerHTML={{ __html: s.html }} />
            </details>
          ))}
          {p.faq.length > 0 && (
            <div className="border-t border-[var(--line)] py-3">
              <h2 className="m-0 mb-2 text-lg font-semibold">Питання і відповіді</h2>
              {p.faq.map(({ q, a }) => (
                <details key={q} className="py-1.5">
                  <summary className="cursor-pointer font-medium">{q}</summary>
                  <p className="mt-1.5 mb-0 text-[var(--muted)]">{a}</p>
                </details>
              ))}
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }) }} />
            </div>
          )}
        </section>
        <ProductReviews list={reviews} />
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="m-0 mb-4 text-xl font-bold">Пасує разом</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map((r) => (
                <Link key={r.handle} href={`/p/${r.handle}`} className="grid content-start gap-1.5">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--card)]">{r.images[0] && <Image src={r.images[0].url} alt={r.images[0].alt} fill sizes="25vw" className="object-cover" />}</div>
                  <span className="text-sm">{r.title}</span>
                  <b className="tabular-nums">від {formatUAH(r.minPrice)}</b>
                </Link>
              ))}
            </div>
          </section>
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(ld) }} />
        {viewed && <TrackEvent name="view_item" params={{ value: viewed.price, items: [viewed] }} />}
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
