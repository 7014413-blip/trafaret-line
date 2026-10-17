"use client";

// Home page blocks: catalogue rail (categories from Medusa), product rail by sections
// (published products from Medusa, hits first) and the blanks price calculator.

import Image from "next/image";
import Link from "@/components/i18n/LocaleLink";
import { useMemo, useRef, useState } from "react";
import { MATERIALS } from "@/lib/materials";
import { priceBlank } from "@/lib/calculators/pricing";
import { formatUAH } from "@/lib/format";
import { pluralUk } from "@/lib/text/plural-uk";
import type { CatalogCardLite, CategoryLink } from "@/types/catalog";
import type { MaterialType, SheetSize } from "@/types/customizer";
import { CardBadges } from "@/components/catalog/CardBadges";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { HOME } from "@/lib/i18n/dictionaries/home";
import { tr } from "@/lib/i18n/translate";

/* ---------- Left catalog rail with fly-out subcategories ---------- */
export function CatalogRail({ categories }: { categories: CategoryLink[] }) {
  const t = tr(HOME, useLocale());
  return (
    <aside aria-label={t.catalog} className="sticky top-[132px] hidden self-start lg:block">
      <h2 className="mb-2 ml-2.5 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.catalog}</h2>
      <ul>
        {categories.map((c) => (
          <li key={c.handle} className="group relative">
            <Link href={c.path} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[15px] font-medium group-hover:bg-[var(--surface)] group-focus-within:bg-[var(--surface)]">
              {c.name}
            </Link>
            {c.children.length > 0 && (
              <div className="invisible absolute left-full top-[-6px] z-40 ml-2 w-[300px] rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3.5 opacity-0 shadow-[0_16px_40px_rgba(15,23,42,.12)] transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <b className="mb-1.5 block">{c.name}</b>
                {c.children.map((s) => (
                  <Link key={s.handle} href={s.path} className="block py-1 text-[15px] text-[var(--muted)] hover:text-[var(--ink)]">{s.name}</Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ---------- Product card ---------- */
function ProductCard({ p }: { p: CatalogCardLite }) {
  const t = tr(HOME, useLocale());
  return (
    <Link href={`/p/${p.handle}`} className="group grid snap-start content-start gap-2.5">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--card)] transition-shadow group-hover:shadow-[0_10px_28px_rgba(15,23,42,.12)]">
        {p.image && <Image src={p.image.url} alt={p.image.alt} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
        <CardBadges hit={p.hit} isNew={p.isNew} />
        <span aria-hidden className="absolute bottom-2.5 right-2.5 grid h-11 w-11 place-items-center rounded-full bg-[var(--buy)] text-xl font-bold text-[var(--buy-fg)]">+</span>
      </div>
      <h3 className="m-0 text-[15px] font-medium leading-snug">{p.title}</h3>
      <b className="text-[19px] tabular-nums">{t.from} {formatUAH(p.minPrice)}</b>
      <div className="text-[13px] text-[var(--muted)]">{p.sizeCount} {pluralUk(p.sizeCount, t.sizeForms)} · {p.materialLabels.length} {pluralUk(p.materialLabels.length, t.materialForms)}</div>
    </Link>
  );
}

export interface RailTab {
  title: string;
  href: string;
  products: CatalogCardLite[];
}

/* ---------- Tabbed product rail (carousel) ---------- */
export function ProductRail({ tabs }: { tabs: RailTab[] }) {
  const t = tr(HOME, useLocale());
  const visible = tabs.filter((t) => t.products.length);
  const [tab, setTab] = useState(visible[0]?.title ?? "");
  const row = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  const current = visible.find((t) => t.title === tab) ?? visible[0];
  if (!current) return null;
  return (
    <section className="mb-11 grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="m-0 text-[clamp(22px,2.4vw,32px)] font-bold tracking-tight">{t.railTitle}</h2>
        <Link href={current.href} className="border-b-[1.5px] border-[var(--ink)] text-[15px] font-bold">{t.railAll}</Link>
      </div>
      <div role="tablist" className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {visible.map((item) => (
          <button key={item.title} role="tab" aria-selected={item.title === current.title} type="button" onClick={() => { setTab(item.title); row.current?.scrollTo({ left: 0 }); }}
            className={`h-10 flex-none rounded-full border-[1.5px] px-4 font-medium ${item.title === current.title ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
            {item.title}
          </button>
        ))}
      </div>
      <div className="relative">
        <div ref={row} className="grid snap-x snap-mandatory auto-cols-[calc((100%-12px)/2)] grid-flow-col gap-3 overflow-x-auto [scrollbar-width:none] sm:auto-cols-[calc((100%-32px)/3)] sm:gap-4 xl:auto-cols-[calc((100%-60px)/4)] xl:gap-5">
          {current.products.map((p) => <ProductCard key={p.handle} p={p} />)}
        </div>
        <button type="button" aria-label={t.scrollLeft} onClick={() => scroll(-1)} className="absolute -left-4 top-[34%] hidden h-11 w-11 rounded-full bg-[var(--card)] text-xl shadow-[0_6px_18px_rgba(15,23,42,.14)] sm:block">‹</button>
        <button type="button" aria-label={t.scrollRight} onClick={() => scroll(1)} className="absolute -right-4 top-[34%] hidden h-11 w-11 rounded-full bg-[var(--card)] text-xl shadow-[0_6px_18px_rgba(15,23,42,.14)] sm:block">›</button>
      </div>
    </section>
  );
}
/* ---------- Blanks calculator: price per piece only, no m² shown ---------- */
const SHAPES = ["circle", "square", "rect"] as const;
const BLANK_MATS: MaterialType[] = ["acrylic_1_5", "acrylic_3", "acrylic_6", "acrylic_white_3", "acrylic_black_3", "acrylic_color", "polystyrene_mirror_1", "pet_food_board"];
const SIZES = [15, 20, 25, 30, 40];

function Chips<T extends string | number>({ items, value, onChange, label }: { items: readonly (readonly [T, string])[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="mb-3.5 grid gap-2">
      <span className="text-[13px] font-bold text-[var(--muted)]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map(([v, t]) => (
          <button key={String(v)} type="button" aria-pressed={v === value} onClick={() => onChange(v)}
            className={`h-10 rounded-full border-[1.5px] px-3.5 tabular-nums ${v === value ? "border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)] font-medium"}`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BlanksCalculator() {
  const locale = useLocale();
  const t = tr(HOME, locale);
  const [shape, setShape] = useState<"circle" | "square" | "rect">("circle");
  const [mat, setMat] = useState<MaterialType>("acrylic_3");
  const [size, setSize] = useState(20);
  const m = MATERIALS[mat];
  const w = size * 10, h = shape === "rect" ? Math.round(size * 6) : size * 10;
  const sheet: SheetSize = { shape: shape === "circle" ? "circle" : "rect", widthMm: w, heightMm: h };
  const one = useMemo(() => priceBlank(sheet, m, 1), [shape, mat, size]); // eslint-disable-line react-hooks/exhaustive-deps
  const ten = useMemo(() => priceBlank(sheet, m, 10), [shape, mat, size]); // eslint-disable-line react-hooks/exhaustive-deps
  const fill = m.finish === "mirror" ? "url(#mir)" : mat === "acrylic_color" ? "#e76f51" : m.look.face;
  const label = `${shape === "circle" ? "Ø" : ""}${size}${shape === "rect" ? `×${h / 10}` : shape === "square" ? `×${size}` : ""} см`;

  return (
    <section className="mb-11 grid items-center gap-7 rounded-[20px] bg-[var(--surface)] p-5 md:grid-cols-2 md:p-7">
      <div>
        <h2 className="m-0 mb-2 text-[clamp(22px,2.4vw,30px)] font-bold">{t.blanksTitle}</h2>
        <p className="mb-4 text-[var(--muted)]">{t.blanksLead}</p>
        <Chips label={t.shape} items={SHAPES.map((id) => [id, t.shapes[id]] as const)} value={shape} onChange={setShape} />
        <Chips label={t.material} items={BLANK_MATS.map((id) => [id, MATERIALS[id].name[locale]] as const)} value={mat} onChange={setMat} />
        <Chips label={t.size} items={SIZES.map((s) => [s, `${s} см`] as const)} value={size} onChange={setSize} />
      </div>
      <div className="grid justify-items-center gap-3.5 text-center">
        <svg viewBox="0 0 200 200" className="h-auto w-[min(260px,70%)]" aria-hidden>
          <defs><linearGradient id="mir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4f6f8" /><stop offset=".5" stopColor="#b9c0c7" /><stop offset="1" stopColor="#eef1f4" /></linearGradient></defs>
          {shape === "circle" && <circle cx="100" cy="100" r="80" fill={fill} stroke="#94a3b8" strokeWidth="1.5" />}
          {shape === "square" && <rect x="20" y="20" width="160" height="160" rx="4" fill={fill} stroke="#94a3b8" strokeWidth="1.5" />}
          {shape === "rect" && <rect x="20" y="52" width="160" height="96" rx="4" fill={fill} stroke="#94a3b8" strokeWidth="1.5" />}
          <text x="100" y="196" textAnchor="middle" fontSize="12" fill="#475569">{label}</text>
        </svg>
        <div className="text-[34px] font-extrabold leading-none tabular-nums">
          {formatUAH(one.unitPrice)}
          <small className="mt-1.5 block text-sm font-normal text-[var(--muted)]">{t.perPiece} · {t.fromTen} {formatUAH(ten.unitPrice)} {t.perPieceShort}</small>
        </div>
        <Link href="/zahotovky" className="inline-flex h-[52px] items-center rounded-full bg-[var(--buy)] px-6 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)]">{t.blanksButton}</Link>
      </div>
    </section>
  );
}
