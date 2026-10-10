"use client";

// Product page: gallery + buy box for a Medusa product. Size chips carry their own
// price, material cards show the price for the chosen size, the quantity scale is the
// same as for stencils (lib/calculators/pricing.ts priceCatalogVariant), the server
// re-reads the variant price before the order. Named products ask for their texts;
// products with their own personalisation (wedding monograms) pass it in `personal`.
// No m² anywhere.

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { CatalogImage, CatalogProduct, CatalogVariant } from "@/types/catalog";
import { DEFAULT_PRICING, priceCatalogVariant } from "@/lib/calculators/pricing";
import { formatUAH } from "@/lib/format";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { materialForCode } from "@/lib/catalog/material-map";
import { useCart } from "@/store/cart-store";

export function Gallery({ images, title }: { images: CatalogImage[]; title: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="aspect-square rounded-[20px] border border-[var(--line)] bg-[var(--surface)]" aria-label={title} />;
  return (
    <div className="grid gap-2.5 self-start lg:sticky lg:top-24">
      <div className="relative aspect-square max-w-full overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--card)]">
        <Image src={images[i].url} alt={images[i].alt} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-contain" />
        <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs text-[#0f172a]">{i + 1} / {images.length}</span>
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
          {images.map((img, k) => (
            <button key={img.url} type="button" aria-label={`Фото ${k + 1}: ${img.alt}`} onClick={() => setI(k)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 ${k === i ? "border-[var(--ink)]" : "border-transparent"}`}>
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Personalisation that a product page renders itself (fields, checks, what goes to production). */
export interface BuyBoxPersonalisation {
  /** Inputs shown in place of the plain text fields. */
  node: ReactNode;
  /** False while something required is missing or wrong. */
  ready: boolean;
  /** Short text for the cart line, e.g. «А & Д, 27.09.2026, Гілочка й дуга». */
  summary: string;
  /** Production data saved with the order. */
  spec: Record<string, unknown>;
}

export function ProductBuyBox({ p, personal, onVariantChange }: {
  p: CatalogProduct;
  personal?: BuyBoxPersonalisation;
  /** Called with the chosen size and material whenever they change. */
  onVariantChange?: (variant: CatalogVariant | undefined) => void;
}) {
  const sizes = p.sizes.filter((s) => p.variants.some((v) => v.sizeLabel === s.label));
  const [size, setSize] = useState(sizes[Math.min(1, sizes.length - 1)]?.label ?? "");
  const materials = useMemo(() => p.materials.filter((m) => p.variants.some((v) => v.materialLabel === m && v.sizeLabel === size)), [p, size]);
  const [material, setMaterial] = useState(p.materials[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>(() => Object.fromEntries(p.fields.map((f) => [f.key, f.placeholder])));

  const find = (s: string, m: string): CatalogVariant | undefined => p.variants.find((v) => v.sizeLabel === s && v.materialLabel === m);
  const chosenMaterial = materials.includes(material) ? material : materials[0] ?? "";
  const variant = find(size, chosenMaterial);
  const cheapestFor = (s: string) => Math.min(...p.variants.filter((v) => v.sizeLabel === s).map((v) => v.price));
  const unit = variant ? priceCatalogVariant(variant.price, qty) : 0;
  const tiers = [{ minQty: 1, discount: 0 }, ...DEFAULT_PRICING.stencilTiers];
  const date = formatDispatch(estimateDispatchDate(new Date()));
  const sizeDetail = sizes.find((s) => s.label === size)?.detail;
  const missingField = personal ? !personal.ready : p.fields.some((f) => !fields[f.key]?.trim());

  useEffect(() => {
    onVariantChange?.(variant);
  }, [variant, onVariantChange]);

  const cart = useCart();
  // «Немає в наявності» from the admin cabinet: shown, but not sold.
  const soldOut = p.availability === "out_of_stock";
  const add = () => {
    if (!variant || missingField || soldOut) return;
    const sheet = variant.sheetMm ?? [300, 300];
    const texts = personal ? personal.summary : p.fields.map((f) => fields[f.key]?.trim()).filter(Boolean).join(" / ");
    const spec = personal ? personal.spec : p.fields.length ? { fields } : undefined;
    cart.add({
      key: `cat|${variant.id}|${JSON.stringify(spec ?? {})}`,
      kind: "catalog",
      variantId: variant.id,
      basePrice: variant.price,
      title: `${p.title}, ${variant.sizeLabel}, ${variant.materialLabel}${texts ? ` («${texts}»)` : ""}`,
      materialId: materialForCode(variant.materialCode),
      widthCm: sheet[0] / 10,
      heightCm: sheet[1] / 10,
      quantity: qty,
      thumbnail: p.images[0]?.url,
      spec,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="grid content-start gap-5">
      <div>
        <h1 className="m-0 text-[clamp(22px,2.6vw,28px)] font-bold leading-tight [text-wrap:balance]">{p.title}</h1>
        {p.subtitle && <p className="mt-1.5 mb-0 text-[var(--muted)]">{p.subtitle}</p>}
        {variant?.sku && <div className="mt-1 text-xs text-[var(--muted)]">Артикул {variant.sku}</div>}
      </div>

      {personal?.node}

      {!personal && p.fields.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-semibold">Ваш текст</legend>
          {p.fields.map((f) => (
            <label key={f.key} className="grid gap-1 text-sm text-[var(--muted)]">{f.label}
              <input id={`fld-${f.key}`} value={fields[f.key] ?? ""} maxLength={40} onChange={(e) => setFields((x) => ({ ...x, [f.key]: e.target.value }))}
                className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base text-[var(--ink)]" />
            </label>
          ))}
          <span className="text-[13px] text-[var(--muted)]">Перед порізкою надішлемо превʼю з вашим текстом у Viber або Telegram.</span>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Розмір</span>
          <div role="radiogroup" aria-label="Розмір" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {sizes.map((s) => (
              <button key={s.label} type="button" role="radio" aria-checked={s.label === size} onClick={() => setSize(s.label)}
                className={`grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 tabular-nums ${s.label === size ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                <b className="text-[15px]">{s.label}</b>
                <span className="text-[13px] text-[var(--muted)]">від {formatUAH(cheapestFor(s.label))}</span>
              </button>
            ))}
          </div>
          {sizeDetail && <span className="text-[13px] text-[var(--muted)]">{sizeDetail}</span>}
        </div>
      )}

      {materials.length > 0 && (
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Матеріал</span>
          {materials.map((m) => {
            const v = find(size, m);
            return (
              <label key={m} className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border-[1.5px] bg-[var(--card)] px-3.5 py-3 ${m === chosenMaterial ? "border-[var(--ink)]" : "border-[var(--line)]"}`}>
                <input type="radio" name="mat" checked={m === chosenMaterial} onChange={() => setMaterial(m)} className="h-[18px] w-[18px] accent-[var(--ink)]" />
                <b>{m}</b>
                <em className="not-italic font-semibold tabular-nums">{v ? formatUAH(v.price) : ""}</em>
              </label>
            );
          })}
        </div>
      )}

      {variant && (
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Ціна від кількості</span>
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs tabular-nums">
            {tiers.map((t) => {
              const on = qty >= t.minQty && !tiers.some((x) => x.minQty > t.minQty && qty >= x.minQty);
              return (
                <button type="button" key={t.minQty} onClick={() => setQty(t.minQty)} className={`rounded-lg border-[1.5px] px-1 py-1.5 ${on ? "border-[var(--ok)]" : "border-dashed border-[var(--line)] text-[var(--muted)]"}`}>
                  <b className="block text-sm text-[var(--ink)]">{formatUAH(priceCatalogVariant(variant.price, t.minQty))}</b>{t.minQty === 1 ? "1 шт." : `від ${t.minQty} шт.`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] p-4">
        <div className="text-[30px] font-extrabold leading-none tabular-nums">{formatUAH(unit * qty)}
          <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{size} · {chosenMaterial}{qty > 1 ? ` · ${formatUAH(unit)} × ${qty}` : ""}</small>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] bg-[var(--card)] text-lg">−</button>
          <input id="qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Number(e.target.value) || 1)))} aria-label="Кількість" className="h-10 w-14 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
          <button type="button" aria-label="Більше" onClick={() => setQty(Math.min(9999, qty + 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] bg-[var(--card)] text-lg">+</button>
        </div>
      </div>

      {p.availability !== "in_stock" && (
        <p role="status" className="m-0 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm">
          {soldOut ? "Зараз немає в наявності. Напишіть нам у Viber, повідомимо, коли зʼявиться." : "Під замовлення: строк виготовлення уточнить менеджер."}
        </p>
      )}
      <button type="button" onClick={add} disabled={!variant || missingField || soldOut} className="h-[52px] rounded-full bg-[var(--buy)] font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] active:scale-[.97] disabled:opacity-50">{soldOut ? "Немає в наявності" : added ? "✓ Додано" : "Купити"}</button>

      <ul className="m-0 grid list-none gap-1.5 p-0 text-sm">
        <li>✓ <b>{date}</b> · Нова пошта, Укрпошта</li>
        <li>✓ Оплата карткою, Apple Pay, Google Pay або при отриманні</li>
        <li>✓ Обмін і повернення 14 днів, індивідуальні вироби — якщо брак</li>
      </ul>

      <div className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom,0px))] z-30 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 py-2 lg:hidden">
        <b className="tabular-nums">{formatUAH(unit * qty)} · {size}</b>
        <button type="button" onClick={add} disabled={!variant || missingField || soldOut} className="h-11 rounded-full bg-[var(--buy)] px-6 font-bold text-[var(--buy-fg)] disabled:opacity-50">{soldOut ? "Немає" : added ? "✓" : "Купити"}</button>
      </div>
    </div>
  );
}
