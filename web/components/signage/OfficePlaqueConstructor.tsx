"use client";

// «Офісна табличка» constructor (Денис 2026-10-10): black or white acrylic base, mirror plate
// (gold, silver, bronze gold, satin silver) with the customer's engraved text, 3M tape on the
// back. The customer changes the text lines and fonts, the base and plate colours and the size;
// preview and price change at once. Sizes in cm, prices in UAH only.
// Layout: lib/office-plaque/layout.ts, price: lib/office-plaque/price.ts (repeated on the server).

import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { BuyPanel } from "@/components/signage/BuyPanel";
import { ConstructorHeader } from "@/components/signage/ConstructorHeader";
import { DesignChecks } from "@/components/signage/DesignChecks";
import { OfficePlaquePreview } from "@/components/signage/OfficePlaquePreview";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { QuantityField } from "@/components/signage/QuantityField";
import { SizePresetPicker } from "@/components/signage/SizePresetPicker";
import { FIELDSET_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { useBuyState } from "@/lib/client/use-buy-state";
import { useDispatchLabel } from "@/lib/client/use-dispatch-label";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { usePresetSize } from "@/lib/client/use-preset-size";
import { plaqueThumbnailSvg } from "@/lib/export/plaque-thumbnail";
import { units } from "@/lib/i18n/dictionaries/units";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { SIGNAGE_PLAQUES } from "@/lib/i18n/dictionaries/signage-plaques";
import { tr } from "@/lib/i18n/translate";
import { checkOfficePlaque } from "@/lib/office-plaque/check";
import { PLAQUE_BASE_COLOURS, PLAQUE_PLATE_COLOURS, findPlaqueBase, findPlaquePlate } from "@/lib/office-plaque/colours";
import { DEFAULT_OFFICE_PLAQUE_CONFIG } from "@/lib/office-plaque/config";
import { computePlaqueLayout } from "@/lib/office-plaque/layout";
import { plaqueBasePrice, priceOfficePlaque } from "@/lib/office-plaque/price";
import { clampPlaqueSizeMm } from "@/lib/office-plaque/size";
import { useCart } from "@/store/cart-store";
import type { OfficePlaqueDesign } from "@/types/office-plaque";
import type { PlaqueTextLine } from "@/types/plaques";
import { cmText } from "@/lib/format";

const CFG = DEFAULT_OFFICE_PLAQUE_CONFIG;
// Fonts and sizes of the example lines; their texts come in the page language.
const FIRST_LINES: Omit<PlaqueTextLine, "text">[] = [
  { fontId: "lora", size: 1 },
  { fontId: "montserrat", size: 0.6 },
];

const clampSize = (widthMm: number, heightMm: number) => clampPlaqueSizeMm(widthMm, heightMm, CFG);

function plateSwatch(hex: string, highlight: string, satin: boolean): string {
  return satin ? `linear-gradient(90deg, ${highlight}, ${hex} 50%, ${highlight})` : `linear-gradient(135deg, ${hex}, ${highlight} 40%, ${hex} 60%, ${highlight})`;
}

export function OfficePlaqueConstructor() {
  const locale = useLocale();
  const s = tr(SIGNAGE, locale);
  const t = tr(SIGNAGE_PLAQUES, locale);
  const o = t.office;
  const sizeState = usePresetSize(CFG.presets, { w: 21, h: 6 }, clampSize);
  const { sizeCode, size } = sizeState;
  const [baseId, setBaseId] = useState("black");
  const [plateId, setPlateId] = useState("gold");
  const [qty, setQty] = useState(1);
  const buyState = useBuyState();
  const dispatch = useDispatchLabel(locale);
  const text = usePlaqueLines(FIRST_LINES.map((l, i) => ({ ...l, text: o.startLines[i] })), CFG.maxLines);
  const cart = useCart();

  const design: OfficePlaqueDesign = {
    sizeCode, widthMm: size.widthMm, heightMm: size.heightMm, baseColourId: baseId, plateColourId: plateId,
    lines: text.lines.map((l) => ({ text: l.text.replace(/\s+/g, " ").trim(), fontId: l.fontId, size: l.size })),
    quantity: qty,
  };
  const layout = computePlaqueLayout(design, text.measured.map((m) => m?.measure ?? null));
  const linePaths = new Map<number, string>();
  text.measured.forEach((m, i) => { if (m) linePaths.set(i, m.pathData); });
  const checks = text.fontsReady ? checkOfficePlaque(layout, text.measured.map((m) => m?.missing ?? [])) : [];
  const errors = checks.filter((c) => c.level === "error");
  const price = priceOfficePlaque(design, undefined, undefined, locale);
  const base = findPlaqueBase(baseId);
  const plate = findPlaquePlate(plateId);
  const canBuy = errors.length === 0 && text.fontsReady;

  const buy = () => {
    if (!canBuy) return;
    const texts = design.lines.map((l) => l.text).filter(Boolean).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `plaque|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: o.cartTitle(texts, `${cmText(design.widthMm, locale)}×${cmText(design.heightMm, locale)}`, plate.name[locale].toLowerCase()),
      materialId: "acrylic_mirror_3",
      widthCm: design.widthMm / 10,
      heightCm: design.heightMm / 10,
      quantity: qty,
      kind: "plaque",
      plaque: design,
      basePrice: price.internal.basePrice,
      vectorSvg: plaqueThumbnailSvg(layout, linePaths, base, plate),
    });
    buyState.added();
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label={t.previewRegion} className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#eceeef] lg:sticky lg:top-24">
        <OfficePlaquePreview layout={layout} linePaths={linePaths} base={base} plate={plate} label={o.previewLabel(`${cmText(size.widthMm, locale)}×${cmText(size.heightMm, locale)}`)} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{cmText(size.widthMm, locale)} × {cmText(size.heightMm, locale)} {units(locale).cm}{o.tape}</span>
          <span>{o.layers(base.name[locale].toLowerCase(), plate.name[locale].toLowerCase())}</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <ConstructorHeader kicker={o.kicker} title={o.title} lead={o.lead} />

        <SizePresetPicker idPrefix="op" presets={CFG.presets} priceOf={(p) => plaqueBasePrice(p.widthMm, p.heightMm, CFG)} state={sizeState} limits={CFG} columns={3}
          note={s.sizeRange(cmText(CFG.minWidthMm, locale), cmText(CFG.maxWidthMm, locale), cmText(CFG.minHeightMm, locale), cmText(CFG.maxHeightMm, locale))} />

        <PlaqueLinesEditor state={text} legend={o.linesLegend} idPrefix="op" maxChars={CFG.maxLineChars}
          capByLine={new Map(layout.lines.map((l) => [l.index, l.capMm]))} />

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{o.plate}</legend>
          <div role="radiogroup" aria-label={o.plateColour} className="flex flex-wrap gap-2.5">
            {PLAQUE_PLATE_COLOURS.map((c) => (
              <button key={c.id} id={`op-plate-${c.id}`} type="button" role="radio" aria-checked={plateId === c.id} title={c.name[locale]} onClick={() => setPlateId(c.id)}
                className={`h-10 w-10 rounded-full border-2 ${plateId === c.id ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`}
                style={{ background: plateSwatch(c.hex, c.highlight, c.satin) }}><span className="sr-only">{c.name[locale]}</span></button>
            ))}
          </div>
          <span className="text-[13px] text-[var(--muted)]">{o.plateNote(plate.name[locale])}</span>
        </fieldset>

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{s.base}</legend>
          <div className="flex flex-wrap gap-2">
            {PLAQUE_BASE_COLOURS.map((c) => <PlaqueChip key={c.id} id={`op-base-${c.id}`} on={baseId === c.id} onClick={() => setBaseId(c.id)}>{c.name[locale]}</PlaqueChip>)}
          </div>
        </fieldset>

        <QuantityField idPrefix="op" value={qty} onChange={setQty} />

        <DesignChecks checks={checks} />

        <BuyPanel lines={price.lines.map((label) => ({ label }))} total={price.total} unitPrice={price.unitPrice} qty={qty} note={dispatch}
          state={buyState.state} canBuy={canBuy} onBuy={buy} />
      </form>
    </div>
  );
}
