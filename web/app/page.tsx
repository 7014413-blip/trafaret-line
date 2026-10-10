import type { Metadata } from "next";
import Image from "next/image";
import { pageMeta } from "@/lib/seo/page-meta";
import Link from "next/link";
import { IDEAS, RAIL_TABS, SCENARIOS } from "@/data/home";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { BlanksCalculator, CatalogRail, ProductRail, type RailTab } from "@/components/home/HomeSections";
import { listCategories, listFirstProducts } from "@/services/medusa-store";
import { MATERIALS } from "@/lib/materials";
import { unitPrice } from "@/lib/calculators/pricing";
import { formatUAH } from "@/lib/format";
import { toCardLite, toCategoryLink } from "@/lib/catalog/card-lite";
import type { CategoryLink } from "@/types/catalog";
import { StencilSprayHero } from "@/components/home/StencilSprayHero";

const container = "mx-auto max-w-[1320px] px-4 lg:px-8";

function SectionHead({ title, link }: { title: string; link?: [string, string] }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 className="m-0 text-[clamp(22px,2.4vw,32px)] font-bold tracking-tight">{title}</h2>
      {link && <Link href={link[1]} className="border-b-[1.5px] border-[var(--ink)] text-[15px] font-bold">{link[0]}</Link>}
    </div>
  );
}

export const revalidate = 300;

export const metadata: Metadata = pageMeta({
  title: "Trafaret Line — трафарети від виробника",
  absoluteTitle: true,
  description: "Трафарети для стін, штукатурки, тортів і бізнесу від виробника. Свій напис з превʼю, заготовки з акрилу та ПЕТ. Виготовлення 3 робочі дні.",
  path: "/",
});

/** Categories and product tabs; the page still renders (without them) when the shop is offline. */
async function catalogBlocks(): Promise<{ roots: CategoryLink[]; tabs: RailTab[] }> {
  try {
    const { roots } = await listCategories();
    const tabs = await Promise.all(RAIL_TABS.map(async (tab) => {
      const category = roots.find((c) => c.handle === tab.handle);
      if (!category) return { title: tab.title, href: `/${tab.handle}`, products: [] };
      const products = await listFirstProducts([category.id, ...category.children.map((c) => c.id)], 36);
      const ordered = [...products].sort((a, b) => Number(b.hit) - Number(a.hit)).slice(0, 12).map(toCardLite);
      return { title: tab.title, href: category.path, products: ordered };
    }));
    // Only names and links go to the page, not the category texts (QA M10: home was 580 KB).
    return { roots: roots.map(toCategoryLink), tabs };
  } catch (error) {
    console.error("[home] catalogue is not available", error);
    return { roots: [], tabs: [] };
  }
}

export default async function Home() {
  const { roots, tabs } = await catalogBlocks();
  const heroPrice = unitPrice(60, 60, MATERIALS.pet_thin);
  return (
    <div className="pb-[76px] lg:pb-0">
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />

      <div className={container}>
        <section className="grid items-center gap-5 py-4 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] md:gap-10 md:pt-9 md:pb-7">
          <div>
            <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(30px,4.6vw,60px)] font-bold leading-[1.06] tracking-[-0.02em] [text-wrap:balance]">
              Візерунок на стіні{" "}
              <em className="not-italic underline decoration-[var(--muted)] decoration-dashed decoration-[3px] underline-offset-8">за&nbsp;один вечір</em>
            </h1>
            <p className="mt-4 mb-6 max-w-[44ch] text-[clamp(16px,1.4vw,19px)] text-[var(--muted)]">
              Трафарети від виробника для стін, меблів, тортів і бізнесу. Обирайте з каталогу або впишіть свій текст і одразу побачите ціну.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" prefetch={false} className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--buy)] px-6 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] active:scale-[.97] sm:w-auto">Обрати трафарет</Link>
              <Link href="/konstruktor" className="inline-flex h-[52px] w-full items-center justify-center rounded-full px-6 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)] active:scale-[.97] sm:w-auto">Зробити свій →</Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
              <span><b className="text-[var(--ink)]">від 150 ₴</b> за трафарет</span>
              <span><b className="text-[var(--ink)]">до 1,4 × 2 м</b> одним листом</span>
              <span><b className="text-[var(--ink)]">3 дні</b> виготовлення</span>
              <span>Бориспіль · Запоріжжя</span>
            </div>
          </div>
          <div className="relative order-first aspect-[4/3] max-w-full overflow-hidden rounded-[20px] bg-[var(--surface)] md:order-none md:aspect-[16/11]">
            <StencilSprayHero className="block h-full w-full" label="Анімація: трафарет фарбують і знімають зі стіни" />
            <span className="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-bold text-[#0f172a]">Мандала 60×60 · PET 0,5 мм</span>
            <span className="absolute bottom-3.5 right-3.5 rounded-xl bg-[#0f172a] px-3 py-2 text-[13px] leading-tight text-white">від <b className="block text-base">{heroPrice ? formatUAH(heroPrice) : ""}</b></span>
          </div>
        </section>

        <nav aria-label="Сценарії" className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {SCENARIOS.map((s) => (
            <Link key={s.title} href={s.href} className="flex flex-none items-center gap-2.5 rounded-full bg-[var(--surface)] py-1.5 pl-1.5 pr-4 text-[15px] font-medium hover:bg-[var(--line)]">
              <span className="relative h-10 w-10 overflow-hidden rounded-full"><Image src={s.img} alt="" fill sizes="40px" className="object-cover" /></span>
              {s.title}
            </Link>
          ))}
        </nav>
      </div>

      <div className={`${container} grid gap-8 py-7 lg:grid-cols-[260px_minmax(0,1fr)]`}>
        <CatalogRail categories={roots} />
        <main className="min-w-0">
          <ProductRail tabs={tabs} />

          <section className="mb-11 grid gap-4">
            <SectionHead title="Ідеї, з чого почати" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {IDEAS.map((i) => (
                <Link key={i.title} href={i.href} className={`relative flex aspect-[4/3] max-w-full items-end overflow-hidden rounded-2xl bg-[var(--surface)] ${i.big ? "md:row-span-2 md:aspect-auto" : ""}`}>
                  <Image src={i.img} alt="" fill sizes="(max-width:768px) 50vw, 33vw" className="object-cover" />
                  <span className="relative m-3 rounded-full bg-[var(--card)] px-3.5 py-2 text-[15px] font-bold">{i.title}</span>
                </Link>
              ))}
            </div>
          </section>

          <BlanksCalculator />

          <section className="mb-11 grid gap-4">
            <SectionHead title="Як це працює" />
            <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
              {[
                ["Оберіть рисунок або впишіть текст", "Розмір і матеріал кнопками, ціна одразу."],
                ["Оформіть за хвилину", "Телефон, імʼя, відділення Нової пошти."],
                ["Фарбуйте за вечір", "Виготовимо за 3 робочі дні, відправимо з найближчого філіалу."],
              ].map(([t, d], i) => (
                <li key={t} className="grid gap-1.5 rounded-2xl bg-[var(--surface)] p-5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--buy)] font-extrabold text-[var(--buy-fg)]">{i + 1}</span>
                  <b className="text-lg">{t}</b>
                  <span className="text-[var(--muted)]">{d}</span>
                </li>
              ))}
            </ol>
          </section>

        </main>
      </div>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
