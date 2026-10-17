"use client";

// Category page body: subcategories, filters (instant, no "apply" button), sort and the
// product grid. Products come from Medusa as light cards (services/medusa-store.ts). The
// grid renders 24 cards at a time with «Показати ще» (QA 2026-10-10, M10), filters and sort
// work over the whole section. On phones the filters open from a chip row as a bottom sheet.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CatalogCardLite, CategoryLink } from "@/types/catalog";
import { formatUAH } from "@/lib/format";
import { pluralUk } from "@/lib/text/plural-uk";
import { CardBadges } from "@/components/catalog/CardBadges";

const KIND_LABEL: Record<CatalogCardLite["kind"], string> = {
  ready: "Готовий малюнок",
  named: "З вашим текстом",
  custom: "За вашим макетом",
};

const PAGE = 24;

type Filters = { mat: string[]; kind: string[] };
const EMPTY: Filters = { mat: [], kind: [] };

export function CategoryView({ products, subcategories }: { products: CatalogCardLite[]; subcategories: CategoryLink["children"] }) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState("popular");
  const [sheet, setSheet] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const options = useMemo(() => ({
    mat: [...new Set(products.flatMap((p) => p.materialLabels))].sort(),
    kind: [...new Set(products.map((p) => p.kind))],
  }), [products]);

  const list = useMemo(() => {
    const ok = products.filter((p) =>
      (!f.mat.length || p.materialLabels.some((m) => f.mat.includes(m))) &&
      (!f.kind.length || f.kind.includes(p.kind)));
    const sorted = [...ok];
    if (sort === "cheap") sorted.sort((a, b) => a.minPrice - b.minPrice);
    if (sort === "expensive") sorted.sort((a, b) => b.minPrice - a.minPrice);
    if (sort === "popular") sorted.sort((a, b) => Number(b.hit) - Number(a.hit));
    return sorted;
  }, [products, f, sort]);

  // A new filter or sort starts from the first page again.
  useEffect(() => setShown(PAGE), [f, sort]);

  const toggle = (k: keyof Filters, v: string) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const active = (Object.keys(f) as (keyof Filters)[]).flatMap((k) => f[k].map((v) => [k, v] as const));
  const label = (k: keyof Filters, v: string) => (k === "kind" ? KIND_LABEL[v as CatalogCardLite["kind"]] : v);
  const visible = list.slice(0, shown);
  const rest = list.length - visible.length;

  const group = (k: keyof Filters, title: string) => options[k].length > 1 && (
    <fieldset className="m-0 grid gap-1.5 border-0 p-0">
      <legend className="m-0 mb-0.5 p-0 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">{title}</legend>
      {options[k].map((v) => (
        <label key={v} className="flex cursor-pointer items-center gap-2 text-[15px]">
          <input type="checkbox" id={`f-${k}-${v}`} checked={f[k].includes(v)} onChange={() => toggle(k, v)} className="h-4 w-4 accent-[var(--ink)]" />
          {label(k, v)}
        </label>
      ))}
    </fieldset>
  );
  const filters = <>{group("mat", "Матеріал")}{group("kind", "Тип")}</>;

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside aria-label="Фільтри" className="sticky top-24 hidden content-start gap-5 self-start lg:grid">
        {subcategories.length > 0 && (
          <div className="grid gap-1">
            <h2 className="m-0 mb-0.5 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">Підкатегорії</h2>
            {subcategories.map((s) => <Link key={s.handle} href={s.path} className="py-0.5 text-[15px] hover:underline">{s.name}</Link>)}
          </div>
        )}
        {filters}
      </aside>

      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setSheet(true)} className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-bold text-[var(--bg)] lg:hidden">Фільтри{active.length ? ` · ${active.length}` : ""}</button>
            {active.map(([k, v]) => (
              <button key={k + v} type="button" onClick={() => toggle(k, v)} aria-label={`Прибрати фільтр ${label(k, v)}`} className="min-h-11 rounded-full bg-[var(--surface)] px-3.5 text-sm">{label(k, v)} ×</button>
            ))}
          </div>
          <label className="text-sm text-[var(--muted)]">Сортування{" "}
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-11 rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 text-[var(--ink)]">
              <option value="popular">Популярні</option><option value="cheap">Ціна ↑</option><option value="expensive">Ціна ↓</option>
            </select>
          </label>
        </div>

        {list.length === 0 ? (
          <div className="grid justify-items-start gap-3 rounded-2xl bg-[var(--surface)] p-6">
            <b className="text-lg">{products.length ? "Нічого не знайшли з такими фільтрами" : "У цьому розділі товари ще готуються"}</b>
            <span className="text-[var(--muted)]">{products.length ? "Приберіть частину фільтрів або зробіть свій трафарет з текстом." : "Зробіть свій трафарет у конструкторі або надішліть нам свій макет."}</span>
            <div className="flex gap-2">
              {products.length > 0 && <button type="button" onClick={() => setF(EMPTY)} className="rounded-full px-4 py-2 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">Скинути фільтри</button>}
              <Link href="/konstruktor" className="rounded-full bg-[var(--buy)] px-4 py-2 font-bold text-[var(--buy-fg)]">Свій напис</Link>
            </div>
          </div>
        ) : (
          <>
            <p className="m-0 mb-3 text-sm text-[var(--muted)]" aria-live="polite">{list.length} {pluralUk(list.length, ["товар", "товари", "товарів"])}</p>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 xl:gap-5">
              {visible.map((p, i) => (
                <li key={p.handle}>
                  <Link href={`/p/${p.handle}`} className="group grid content-start gap-2">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--card)] transition-shadow group-hover:shadow-[0_10px_28px_rgba(15,23,42,.12)]">
                      {p.image && <Image src={p.image.url} alt={p.image.alt} fill sizes="(max-width:640px) 50vw, (max-width:1280px) 33vw, 25vw" priority={i < 4} className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
                      <CardBadges hit={p.hit} isNew={p.isNew} />
                    </div>
                    <h3 className="m-0 text-[15px] font-medium leading-snug">{p.title}</h3>
                    <div className="text-[13px] text-[var(--muted)]">{KIND_LABEL[p.kind]} · {p.sizeCount} {pluralUk(p.sizeCount, ["розмір", "розміри", "розмірів"])}</div>
                    <b className="text-[19px] tabular-nums">від {formatUAH(p.minPrice)}</b>
                  </Link>
                </li>
              ))}
            </ul>
            {rest > 0 && (
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className="min-h-12 rounded-full px-6 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">
                  Показати ще {Math.min(PAGE, rest)} з {rest}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setSheet(false)}>
          <div role="dialog" aria-modal="true" aria-label="Фільтри" onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 grid max-h-[80vh] gap-5 overflow-auto rounded-t-[20px] bg-[var(--bg)] p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))]">
            {subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2">{subcategories.map((s) => <Link key={s.handle} href={s.path} className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-sm">{s.name}</Link>)}</div>
            )}
            {filters}
            <button type="button" onClick={() => setSheet(false)} className="h-12 rounded-full bg-[var(--buy)] font-bold text-[var(--buy-fg)]">Показати {list.length} {pluralUk(list.length, ["товар", "товари", "товарів"])}</button>
          </div>
        </div>
      )}
    </div>
  );
}
