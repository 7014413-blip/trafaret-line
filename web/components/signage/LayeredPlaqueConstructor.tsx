"use client";

// Constructor of the two-layer plaques (Денис 2026-10-10): floor signs «ПОВЕРХ 1», door signs
// with mirror edging and number plaques. One component, the product's settings decide sizes,
// prices, colours and texts (lib/layered-plaque/configs.ts). The customer changes the text
// lines and fonts, the colours, the size and the frame, and can order a series of numbers
// (floors 1…9, flats 1…120) at once, every number its own plaque. Sizes in cm, prices in UAH.

import { useEffect, useMemo, useState } from "react";
import { LayeredPlaquePreview } from "@/components/signage/LayeredPlaquePreview";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { PointerMaterialPicker } from "@/components/signage/PointerMaterialPicker";
import { nextTierHint } from "@/lib/calculators/pricing";
import { readPlaqueSizeParam } from "@/lib/client/plaque-size-param";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { layeredPlaqueThumbnailSvg } from "@/lib/export/layered-plaque-thumbnail";
import { formatUAH } from "@/lib/format";
import { layeredPlaqueBasePrice } from "@/lib/layered-plaque/base-price";
import { checkLayeredPlaque } from "@/lib/layered-plaque/check";
import { LAYERED_PLAQUE_CONFIGS } from "@/lib/layered-plaque/configs";
import { computeLayeredPlaqueLayout } from "@/lib/layered-plaque/layout";
import { LAYERED_PLAQUE_MATERIALS, findLayeredPlaqueMaterial } from "@/lib/layered-plaque/materials";
import { priceLayeredPlaque } from "@/lib/layered-plaque/price";
import { clampLayeredPlaqueSizeMm } from "@/lib/layered-plaque/size";
import { measurePlaqueLine } from "@/lib/plaques/measure-line";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { useCart } from "@/store/cart-store";
import type { LayeredPlaqueDesign, LayeredPlaqueKind } from "@/types/layered-plaque";

const legend = "mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]";
const input = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

const COPY: Record<LayeredPlaqueKind, { kicker: string; h1: string; lead: string; base: string; overlay: string; frame: string; series: string; cartName: string }> = {
  floor: {
    kicker: "Таблички для будинку", h1: "Табличка поверху «ПОВЕРХ 1»",
    lead: "Обʼємна табличка з двох шарів акрилу: основа біла чи чорна, напис, номер і рамка з дзеркального акрилу. Замовте одразу весь будинок: кожен поверх своя табличка.",
    base: "Основа", overlay: "Напис і рамка", frame: "Дзеркальна рамка", series: "Усі поверхи одразу", cartName: "Табличка поверху",
  },
  door: {
    kicker: "Таблички на двері", h1: "Табличка на двері з дзеркальною окантовкою",
    lead: "Довга табличка із заокругленими кутами: акрилова основа, дзеркальна окантовка по краю і обʼємні літери. Для кабінетів, салонів, офісів.",
    base: "Основа", overlay: "Літери й окантовка", frame: "Дзеркальна окантовка", series: "", cartName: "Табличка на двері",
  },
  number: {
    kicker: "Номерки", h1: "Номерок на двері з двох шарів акрилу",
    lead: "Лицьовий шар з вирізаним номером лежить на нижньому шарі іншого кольору зі зсувом. Клейова основа вже в ціні. Номери кабінетів, квартир, столиків.",
    base: "Лицьовий шар", overlay: "Нижній шар і колір номера", frame: "", series: "Набір номерів", cartName: "Номерок",
  },
};

export function LayeredPlaqueConstructor({ kind }: { kind: LayeredPlaqueKind }) {
  const cfg = LAYERED_PLAQUE_CONFIGS[kind];
  const copy = COPY[kind];
  const [sizeCode, setSizeCode] = useState(cfg.presets[0].code);
  const [customCm, setCustomCm] = useState({ w: cfg.presets[0].widthMm / 10, h: cfg.presets[0].heightMm / 10 });
  const [baseId, setBaseId] = useState(cfg.defaultBaseId);
  const [overlayId, setOverlayId] = useState(cfg.defaultOverlayId);
  const [frame, setFrame] = useState(cfg.defaultFrame);
  const [seriesOn, setSeriesOn] = useState(false);
  const [series, setSeries] = useState({ from: 1, to: kind === "floor" ? 9 : 20 });
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // Shipping date only in the browser: server and browser format weekdays differently.
  const [dispatch, setDispatch] = useState("виготовлення 3 робочі дні");
  const text = usePlaqueLines(cfg.defaultLines, cfg.maxLines);
  const cart = useCart();
  const seriesLine = cfg.seriesLine;

  useEffect(() => {
    setDispatch(formatDispatch(estimateDispatchDate(new Date())));
    const fromLink = readPlaqueSizeParam(cfg.presets.map((p) => p.code));
    if (fromLink) setSizeCode(fromLink);
  }, [cfg]);

  // A series shows its first number on the plaque in the preview.
  const { setLine } = text;
  useEffect(() => {
    if (seriesOn && seriesLine != null) setLine(seriesLine, { text: String(series.from) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesOn, series.from, seriesLine]);

  const size = useMemo(() => {
    const preset = cfg.presets.find((p) => p.code === sizeCode);
    if (preset) return { widthMm: preset.widthMm, heightMm: preset.heightMm };
    return clampLayeredPlaqueSizeMm(customCm.w * 10, customCm.h * 10, cfg);
  }, [sizeCode, customCm, cfg]);

  const design: LayeredPlaqueDesign = {
    kind, sizeCode, widthMm: size.widthMm, heightMm: size.heightMm, baseMaterialId: baseId, overlayMaterialId: overlayId,
    frame: cfg.frameWidthShare > 0 && frame,
    lines: text.lines.map((l) => ({ text: l.text.replace(/\s+/g, " ").trim(), fontId: l.fontId, size: l.size })),
    series: seriesOn && seriesLine != null ? { from: Math.round(series.from), to: Math.round(series.to) } : null,
    quantity: qty,
  };
  const measures = text.measured.map((m) => m?.measure ?? null);
  const layout = computeLayeredPlaqueLayout(design, measures, cfg);
  const linePaths = new Map<number, string>();
  text.measured.forEach((m, i) => { if (m) linePaths.set(i, m.pathData); });

  // The largest number of a series is the one that must still fit: check with it.
  const widest = useMemo(() => {
    if (!design.series || seriesLine == null) return null;
    const font = text.fontFor(text.lines[seriesLine]?.fontId ?? "");
    return font ? measurePlaqueLine(font, String(design.series.to)) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.series?.to, seriesLine, text.fontFor, text.lines]);
  const checkLayout = widest && seriesLine != null
    ? computeLayeredPlaqueLayout(design, measures.map((m, i) => (i === seriesLine ? widest.measure : m)), cfg)
    : layout;
  const missing = text.measured.map((m, i) => [...(m?.missing ?? []), ...(i === seriesLine ? widest?.missing ?? [] : [])]);
  const checks = text.fontsReady ? checkLayeredPlaque(design, checkLayout, missing, cfg) : [];
  const errors = checks.filter((c) => c.level === "error");
  const price = errors.some((c) => c.code === "series") ? null : priceLayeredPlaque(design, cfg);
  const base = findLayeredPlaqueMaterial(baseId);
  const overlay = findLayeredPlaqueMaterial(overlayId);
  const hint = nextTierHint((price?.count ?? 1) * qty);
  const canBuy = !!price && errors.length === 0 && text.fontsReady;

  const buy = () => {
    if (!canBuy || !price) return;
    const words = design.lines.map((l, i) => (design.series && i === seriesLine ? `${design.series.from}–${design.series.to}` : l.text)).filter(Boolean).join(" ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `layered|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: `${copy.cartName} «${words}», ${cm(design.widthMm)}×${cm(design.heightMm)} см${price.count > 1 ? `, набір ${price.count} шт.` : ""}`,
      materialId: "acrylic",
      widthCm: design.widthMm / 10,
      heightCm: design.heightMm / 10,
      quantity: qty,
      kind: "layered",
      layered: design,
      basePrice: price.internal.basePrice,
      vectorSvg: layeredPlaqueThumbnailSvg(layout, linePaths, base.hex, overlay.hex),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Превʼю таблички" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#eceeef] lg:sticky lg:top-24">
        <LayeredPlaquePreview kind={kind} layout={layout} linePaths={linePaths} base={base} overlay={overlay} label={`Превʼю: ${copy.cartName.toLowerCase()} ${cm(size.widthMm)}×${cm(size.heightMm)} см`} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{cm(size.widthMm)} × {cm(size.heightMm)} см{design.series ? ` · номери ${design.series.from}–${design.series.to}` : ""}</span>
          <span>{base.name.uk} + {overlay.name.uk.toLowerCase()}</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{copy.kicker}</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">{copy.h1}</h1>
          <p className="mt-1.5 mb-0 text-[var(--muted)]">{copy.lead}</p>
        </header>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Розмір</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cfg.presets.map((p) => (
              <button key={p.code} id={`lp-size-${p.code}`} type="button" aria-pressed={sizeCode === p.code} onClick={() => setSizeCode(p.code)}
                className={`grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 tabular-nums ${sizeCode === p.code ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                <b className="text-[15px]">{cm(p.widthMm)}×{cm(p.heightMm)} см</b>
                <span className="text-[13px] text-[var(--muted)]">{formatUAH(p.price)}</span>
              </button>
            ))}
            <button id="lp-size-custom" type="button" aria-pressed={sizeCode === "custom"} onClick={() => setSizeCode("custom")}
              className={`grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 ${sizeCode === "custom" ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
              <b className="text-[15px]">Свій розмір</b>
              <span className="text-[13px] text-[var(--muted)]">{sizeCode === "custom" ? formatUAH(layeredPlaqueBasePrice(size.widthMm, size.heightMm, cfg)) : "ціна одразу"}</span>
            </button>
          </div>
          {sizeCode === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-sm text-[var(--muted)]">Ширина, см
                <input id="lp-w" type="number" inputMode="decimal" step={0.5} min={cfg.minWidthMm / 10} max={cfg.maxWidthMm / 10} value={customCm.w}
                  onChange={(e) => setCustomCm((c) => ({ ...c, w: Number(e.target.value) || 0 }))}
                  onBlur={() => setCustomCm({ w: size.widthMm / 10, h: size.heightMm / 10 })} className={input} />
              </label>
              <label className="grid gap-1 text-sm text-[var(--muted)]">Висота, см
                <input id="lp-h" type="number" inputMode="decimal" step={0.5} min={cfg.minHeightMm / 10} max={cfg.maxHeightMm / 10} value={customCm.h}
                  onChange={(e) => setCustomCm((c) => ({ ...c, h: Number(e.target.value) || 0 }))}
                  onBlur={() => setCustomCm({ w: size.widthMm / 10, h: size.heightMm / 10 })} className={input} />
              </label>
              <span className="col-span-2 text-[13px] text-[var(--muted)]">Ширина від {cm(cfg.minWidthMm)} до {cm(cfg.maxWidthMm)} см, висота від {cm(cfg.minHeightMm)} до {cm(cfg.maxHeightMm)} см.</span>
            </div>
          )}
        </fieldset>

        <PlaqueLinesEditor state={text} legend="Напис" idPrefix="lp" maxChars={cfg.maxLineChars}
          capByLine={new Map(layout.lines.map((l) => [l.index, l.capMm]))} />

        {seriesLine != null && (
          <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>{copy.series}</legend>
            <label className="flex items-center gap-2 text-sm">
              <input id="lp-series" type="checkbox" checked={seriesOn} onChange={(e) => setSeriesOn(e.target.checked)} className="h-5 w-5 accent-[var(--ink)]" />
              Зробити таблички з номерами по порядку (кожен номер окрема табличка)
            </label>
            {seriesOn && (
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-sm text-[var(--muted)]">Від
                  <input id="lp-from" type="number" min={0} step={1} value={series.from} onChange={(e) => setSeries((s) => ({ ...s, from: Math.max(0, Math.round(Number(e.target.value)) || 0) }))} className={input} />
                </label>
                <label className="grid gap-1 text-sm text-[var(--muted)]">До
                  <input id="lp-to" type="number" min={0} step={1} value={series.to} onChange={(e) => setSeries((s) => ({ ...s, to: Math.max(0, Math.round(Number(e.target.value)) || 0) }))} className={input} />
                </label>
                <span className="col-span-2 text-[13px] text-[var(--muted)]">Номер у рядку {seriesLine + 1} заміниться на кожне число. Знижка рахується за всі таблички разом.</span>
              </div>
            )}
          </fieldset>
        )}

        {cfg.frameWidthShare > 0 && (
          <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>{copy.frame}</legend>
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id="lp-frame-on" on={frame} onClick={() => setFrame(true)}>З рамкою</PlaqueChip>
              <PlaqueChip id="lp-frame-off" on={!frame} onClick={() => setFrame(false)}>Без рамки</PlaqueChip>
            </div>
          </fieldset>
        )}

        <PointerMaterialPicker legend={copy.base} value={baseId} onChange={setBaseId} idPrefix="lp-base" materials={LAYERED_PLAQUE_MATERIALS} />
        <PointerMaterialPicker legend={copy.overlay} value={overlayId} onChange={setOverlayId} idPrefix="lp-over" materials={LAYERED_PLAQUE_MATERIALS} />

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>{design.series ? "Кількість наборів" : "Кількість"}</legend>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="lp-qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Math.round(Number(e.target.value)) || 1)))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
            <button type="button" aria-label="Більше" onClick={() => setQty(Math.min(9999, qty + 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
          </div>
          <span className="text-[13px] text-[var(--muted)]">Від 10 шт −5%, від 50 шт −10%, від 100 шт −15%.{hint ? ` Додайте ще ${hint.addQty} шт., щоб отримати −${Math.round(hint.nextDiscount * 100)}%.` : ""}</span>
        </fieldset>

        {checks.length > 0 && (
          <ul className="m-0 grid list-none gap-1 rounded-xl bg-[var(--surface)] p-3 text-sm">
            {checks.map((c, i) => <li key={i} className={c.level === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"}>{c.message.uk}</li>)}
          </ul>
        )}

        <div className="grid gap-2 rounded-2xl bg-[var(--surface)] p-4">
          <ul className="m-0 grid list-none gap-0.5 p-0 text-[13px] text-[var(--muted)]">
            {(price?.lines ?? []).map((l, i) => <li key={i}>{l}</li>)}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[30px] font-extrabold leading-none tabular-nums">{price ? formatUAH(price.total) : "—"}
              <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{price && qty > 1 ? `${formatUAH(price.unitPrice)} × ${qty} · ` : ""}{dispatch}</small>
            </div>
            <button type="button" onClick={buy} disabled={!canBuy} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-40">{added ? "✓ Додано в кошик" : "В кошик"}</button>
          </div>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <b className="text-xl tabular-nums">{price ? formatUAH(price.total) : "—"}</b>
        <button type="button" onClick={buy} disabled={!canBuy} className="h-12 rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] disabled:opacity-40">{added ? "✓ Додано" : "В кошик"}</button>
      </div>
    </div>
  );
}
