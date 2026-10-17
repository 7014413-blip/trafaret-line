"use client";

// Constructor of the two-layer plaques (Денис 2026-10-10): floor signs «ПОВЕРХ 1», door signs
// with mirror edging and number plaques. One component, the product's settings decide sizes,
// prices, colours and texts (lib/layered-plaque/configs.ts). The customer changes the text
// lines and fonts, the colours, the size and the frame, and can order a series of numbers
// (floors 1…9, flats 1…120) at once, every number its own plaque. Sizes in cm, prices in UAH.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { BuyPanel } from "@/components/signage/BuyPanel";
import { ConstructorHeader } from "@/components/signage/ConstructorHeader";
import { DesignChecks } from "@/components/signage/DesignChecks";
import { LayeredPlaquePreview } from "@/components/signage/LayeredPlaquePreview";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { PointerMaterialPicker } from "@/components/signage/PointerMaterialPicker";
import { QuantityField } from "@/components/signage/QuantityField";
import { SizePresetPicker } from "@/components/signage/SizePresetPicker";
import { FIELDSET_CLASS, INPUT_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { useBuyState } from "@/lib/client/use-buy-state";
import { useDispatchLabel } from "@/lib/client/use-dispatch-label";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { usePresetSize } from "@/lib/client/use-preset-size";
import { layeredPlaqueThumbnailSvg } from "@/lib/export/layered-plaque-thumbnail";
import { cmText } from "@/lib/format";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { SIGNAGE_PLAQUES } from "@/lib/i18n/dictionaries/signage-plaques";
import { tr } from "@/lib/i18n/translate";
import { layeredPlaqueBasePrice } from "@/lib/layered-plaque/base-price";
import { checkLayeredPlaque } from "@/lib/layered-plaque/check";
import { LAYERED_PLAQUE_CONFIGS } from "@/lib/layered-plaque/configs";
import { computeLayeredPlaqueLayout } from "@/lib/layered-plaque/layout";
import { LAYERED_PLAQUE_MATERIALS, findLayeredPlaqueMaterial } from "@/lib/layered-plaque/materials";
import { priceLayeredPlaque } from "@/lib/layered-plaque/price";
import { clampLayeredPlaqueSizeMm } from "@/lib/layered-plaque/size";
import { measurePlaqueLine } from "@/lib/plaques/measure-line";
import { useCart } from "@/store/cart-store";
import type { LayeredPlaqueDesign, LayeredPlaqueKind } from "@/types/layered-plaque";
export function LayeredPlaqueConstructor({ kind }: { kind: LayeredPlaqueKind }) {
  const cfg = LAYERED_PLAQUE_CONFIGS[kind];
  const locale = useLocale();
  const s = tr(SIGNAGE, locale);
  const plaques = tr(SIGNAGE_PLAQUES, locale);
  const t = plaques.layered;
  const copy = t.kinds[kind];
  const clampSize = useCallback((widthMm: number, heightMm: number) => clampLayeredPlaqueSizeMm(widthMm, heightMm, cfg), [cfg]);
  const sizeState = usePresetSize(cfg.presets, { w: cfg.presets[0].widthMm / 10, h: cfg.presets[0].heightMm / 10 }, clampSize);
  const { sizeCode, size } = sizeState;
  const [baseId, setBaseId] = useState(cfg.defaultBaseId);
  const [overlayId, setOverlayId] = useState(cfg.defaultOverlayId);
  const [frame, setFrame] = useState(cfg.defaultFrame);
  const [seriesOn, setSeriesOn] = useState(false);
  const [series, setSeries] = useState({ from: 1, to: kind === "floor" ? 9 : 20 });
  const [qty, setQty] = useState(1);
  const buyState = useBuyState();
  const dispatch = useDispatchLabel(locale);
  const text = usePlaqueLines(cfg.defaultLines.map((l, i) => ({ ...l, text: copy.startLines[i] ?? l.text })), cfg.maxLines);
  const cart = useCart();
  const seriesLine = cfg.seriesLine;

  // A series shows its first number on the plaque in the preview.
  const { setLine } = text;
  useEffect(() => {
    if (seriesOn && seriesLine != null) setLine(seriesLine, { text: String(series.from) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesOn, series.from, seriesLine]);

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
  const price = errors.some((c) => c.code === "series") ? null : priceLayeredPlaque(design, cfg, undefined, locale);
  const base = findLayeredPlaqueMaterial(baseId);
  const overlay = findLayeredPlaqueMaterial(overlayId);
  const canBuy = !!price && errors.length === 0 && text.fontsReady;

  const buy = () => {
    if (!canBuy || !price) return;
    const words = design.lines.map((l, i) => (design.series && i === seriesLine ? `${design.series.from}–${design.series.to}` : l.text)).filter(Boolean).join(" ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `layered|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: `${copy.cartName} «${words}», ${cmText(design.widthMm)}×${cmText(design.heightMm)} см${price.count > 1 ? t.setOf(price.count) : ""}`,
      materialId: "acrylic",
      widthCm: design.widthMm / 10,
      heightCm: design.heightMm / 10,
      quantity: qty,
      kind: "layered",
      layered: design,
      basePrice: price.internal.basePrice,
      vectorSvg: layeredPlaqueThumbnailSvg(layout, linePaths, base.hex, overlay.hex),
    });
    buyState.added();
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label={plaques.previewRegion} className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#eceeef] lg:sticky lg:top-24">
        <LayeredPlaquePreview kind={kind} layout={layout} linePaths={linePaths} base={base} overlay={overlay} label={t.previewLabel(copy.cartName.toLowerCase(), `${cmText(size.widthMm)}×${cmText(size.heightMm)}`)} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{cmText(size.widthMm)} × {cmText(size.heightMm)} см{design.series ? t.numbers(design.series.from, design.series.to) : ""}</span>
          <span>{base.name[locale]} + {overlay.name[locale].toLowerCase()}</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <ConstructorHeader kicker={copy.kicker} title={copy.h1} lead={copy.lead} />

        <SizePresetPicker idPrefix="lp" presets={cfg.presets} priceOf={(p) => p.price} state={sizeState} limits={cfg}
          customPrice={layeredPlaqueBasePrice(size.widthMm, size.heightMm, cfg)}
          note={s.sizeRange(cmText(cfg.minWidthMm), cmText(cfg.maxWidthMm), cmText(cfg.minHeightMm), cmText(cfg.maxHeightMm))} />

        <PlaqueLinesEditor state={text} legend={s.text} idPrefix="lp" maxChars={cfg.maxLineChars}
          capByLine={new Map(layout.lines.map((l) => [l.index, l.capMm]))} />

        {seriesLine != null && (
          <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{copy.series}</legend>
            <label className="flex items-center gap-2 text-sm">
              <input id="lp-series" type="checkbox" checked={seriesOn} onChange={(e) => setSeriesOn(e.target.checked)} className="h-5 w-5 accent-[var(--ink)]" />
              {t.seriesToggle}
            </label>
            {seriesOn && (
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-sm text-[var(--muted)]">{t.from}
                  <input id="lp-from" type="number" min={0} step={1} value={series.from} onChange={(e) => setSeries((s) => ({ ...s, from: Math.max(0, Math.round(Number(e.target.value)) || 0) }))} className={INPUT_CLASS} />
                </label>
                <label className="grid gap-1 text-sm text-[var(--muted)]">{t.to}
                  <input id="lp-to" type="number" min={0} step={1} value={series.to} onChange={(e) => setSeries((s) => ({ ...s, to: Math.max(0, Math.round(Number(e.target.value)) || 0) }))} className={INPUT_CLASS} />
                </label>
                <span className="col-span-2 text-[13px] text-[var(--muted)]">{t.seriesNote(seriesLine + 1)}</span>
              </div>
            )}
          </fieldset>
        )}

        {cfg.frameWidthShare > 0 && (
          <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{copy.frame}</legend>
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id="lp-frame-on" on={frame} onClick={() => setFrame(true)}>{t.withFrame}</PlaqueChip>
              <PlaqueChip id="lp-frame-off" on={!frame} onClick={() => setFrame(false)}>{t.noFrame}</PlaqueChip>
            </div>
          </fieldset>
        )}

        <PointerMaterialPicker legend={copy.base} value={baseId} onChange={setBaseId} idPrefix="lp-base" materials={LAYERED_PLAQUE_MATERIALS} />
        <PointerMaterialPicker legend={copy.overlay} value={overlayId} onChange={setOverlayId} idPrefix="lp-over" materials={LAYERED_PLAQUE_MATERIALS} />

        <QuantityField legend={design.series ? s.setsQuantity : undefined} idPrefix="lp" value={qty} onChange={setQty} tierQuantity={(price?.count ?? 1) * qty} />

        <DesignChecks checks={checks} />

        <BuyPanel lines={(price?.lines ?? []).map((label) => ({ label }))} total={price?.total ?? null} unitPrice={price?.unitPrice ?? null} qty={qty} unitLabel="" note={dispatch}
          state={buyState.state} canBuy={canBuy} onBuy={buy} />
      </form>
    </div>
  );
}
