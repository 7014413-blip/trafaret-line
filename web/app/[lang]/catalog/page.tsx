import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import Image from "next/image";
import Link from "@/components/i18n/LocaleLink";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { listCategories } from "@/services/medusa-store";

// Rendered on request (data cached 5 min in services/medusa-store.ts), so the build does not need the shop running.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Каталог трафаретів: стіни, штукатурка, торти, свята, заготовки",
  description: "Усі розділи Trafaret Line: трафарети для стін і штукатурки, для тортів і кави, свята, літери, камуфляж, бізнес і заготовки з акрилу та PET.",
  path: "/catalog",
});

export default async function CatalogPage() {
  const { roots } = await listCategories();
  return (
    <div className="pb-[76px] lg:pb-0">
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <main className="mx-auto max-w-[1320px] px-4 py-5 lg:px-8">
        <nav aria-label="Хлібні крихти" className="mb-3 flex gap-1.5 text-[13px] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--ink)]">Головна</Link>›<span>Каталог</span>
        </nav>
        <h1 className="m-0 mb-6 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,36px)] font-bold leading-tight">Каталог</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roots.map((c) => (
            <section key={c.handle} className="grid content-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3">
              <Link href={c.path} className="grid gap-2.5">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[var(--surface)]">
                  {c.image && <Image src={c.image} alt={c.name} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover" />}
                </div>
                <h2 className="m-0 text-lg font-bold">{c.name}</h2>
              </Link>
              {c.children.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {c.children.map((s) => <Link key={s.handle} href={s.path} className="rounded-full bg-[var(--surface)] px-3 py-1 text-sm hover:bg-[var(--line)]">{s.name}</Link>)}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
