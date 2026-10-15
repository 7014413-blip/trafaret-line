"use client";

// «Офісна табличка» constructor (Денис 2026-10-10): black or white acrylic base, mirror plate
// (gold, silver, bronze gold, satin silver) with the customer's engraved text, 3M tape on the
// back. The customer changes the text lines and fonts, the base and plate colours and the size;
// preview and price change at once. Sizes in cm, prices in UAH only.
// Layout: lib/office-plaque/layout.ts, price: lib/office-plaque/price.ts (repeated on the server).

import { useEffect, useMemo, useState } from "react";
import { OfficePlaquePreview } from "@/components/signage/OfficePlaquePreview";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { nextTierHint } from "@/lib/calculators/pricing";
import { readPlaqueSizeParam } from "@/lib/client/plaque-size-param";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { plaqueThumbnailSvg } from "@/lib/export/plaque-thumbnail";
import { formatUAH } from "@/lib/format";
import { checkOfficePlaque } from "@/lib/office-plaque/check";
import { PLAQUE_BASE_COLOURS, PLAQUE_PLATE_COLOURS, findPlaqueBase, findPlaquePlate } from "@/lib/office-plaque/colours";
import { DEFAULT_OFFICE_PLAQUE_CONFIG } from "@/lib/office-plaque/config";
import { computePlaqueLayout } from "@/lib/office-plaque/layout";
import { plaqueBasePrice, priceOfficePlaque } from "@/lib/office-plaque/price";
import { clampPlaqueSizeMm } from "@/lib/office-plaque/size";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { useCart } from "@/store/cart-store";
import type { OfficePlaqueDesign } from "@/types/office-plaque";
import type { PlaqueTextLine } from "@/types/plaques";

const CFG = DEFAULT_OFFICE_PLAQUE_CONFIG;
const FIRST_LINES: PlaqueTextLine[] = [
  { text: "Олена Коваленко", fontId: "lora", size: 1 },
  { text: "ДИРЕКТОРКА", fontId: "montserrat", size: 0.6 },
];

const legend = "mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]";
const input = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

function plateSwatch(hex: string, highlight: string, satin: boolean): string {
  return satin ? `linear-gradient(90deg, ${highlight}, ${hex} 50%, ${highlight})` : `linear-gradient(135deg, ${hex}, ${highlight} 40%, ${hex} 60%, ${highlight})`;
}

export function OfficePlaqueConstructor() {
  const [sizeCode, setSizeCode] = useState(CFG.presets[0].code);
  const [customCm, setCustomCm] = useState({ w: 21, h: 6 });
  const [baseId, setBaseId] = useState("black");
  const [plateId, setPlateId] = useState("gold");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // Shipping date only in the browser: server and browser format weekdays differently.
  const [dispatch, setDispatch] = useState("виготовлення 3 робочі дні");
  const text = usePlaqueLines(FIRST_LINES, CFG.maxLines);
  const cart = useCart();

  useEffect(() => {
    setDispatch(formatDispatch(estimateDispatchDate(new Date())));
    const fromLink = readPlaqueSizeParam(CFG.presets.map((p) => p.code));
    if (fromLink) setSizeCode(fromLink);
  }, []);

  const size = useMemo(() => {
    const preset = CFG.presets.find((p) => p.code === sizeCode);
    if (preset) return { widthMm: preset.widthMm, heightMm: preset.heightMm };
    return clampPlaqueSizeMm(customCm.w * 10, customCm.h * 10, CFG);
  }, [sizeCode, customCm]);

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
  const price = priceOfficePlaque(design);
  const base = findPlaqueBase(baseId);
  const plate = findPlaquePlate(plateId);
  const hint = nextTierHint(qty);
  const canBuy = errors.length === 0 && text.fontsReady;

  const buy = () => {
    if (!canBuy) return;
    const texts = design.lines.map((l) => l.text).filter(Boolean).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `plaque|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: `Офісна табличка «${texts}», ${cm(design.widthMm)}×${cm(design.heightMm)} см, ${plate.name.uk.toLowerCase()}`,
      materialId: "acrylic_mirror_3",
      widthCm: design.widthMm / 10,
      heightCm: design.heightMm / 10,
      quantity: qty,
      kind: "plaque",
      plaque: design,
      basePrice: price.internal.basePrice,
      vectorSvg: plaqueThumbnailSvg(layout, linePaths, base, plate),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Превʼю таблички" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] bg-[#eceeef] lg:sticky lg:top-24">
        <OfficePlaquePreview layout={layout} linePaths={linePaths} base={base} plate={plate} label={`Превʼю офісної таблички ${cm(size.widthMm)}×${cm(size.heightMm)} см`} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{cm(size.widthMm)} × {cm(size.heightMm)} см · на клейовій основі 3M</span>
          <span>Основа {base.name.uk.toLowerCase()} + {plate.name.uk.toLowerCase()} з гравіюванням</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Конструктор табличок</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">Офісна табличка з гравіюванням</h1>
          <p className="mt-1.5 mb-0 text-[var(--muted)]">Акрилова основа і дзеркальна пластина з вашим написом. Клеїться на двері чи стіну, клейова основа 3M уже в ціні.</p>
        </header>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Розмір</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CFG.presets.map((p) => (
              <button key={p.code} id={`op-size-${p.code}`} type="button" aria-pressed={sizeCode === p.code} onClick={() => setSizeCode(p.code)}
                className={`grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 tabular-nums ${sizeCode === p.code ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                <b className="text-[15px]">{cm(p.widthMm)}×{cm(p.heightMm)} см</b>
                <span className="text-[13px] text-[var(--muted)]">{formatUAH(plaqueBasePrice(p.widthMm, p.heightMm, CFG))}</span>
              </button>
            ))}
            <button id="op-size-custom" type="button" aria-pressed={sizeCode === "custom"} onClick={() => setSizeCode("custom")}
              className={`grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 ${sizeCode === "custom" ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
              <b className="text-[15px]">Свій розмір</b>
              <span className="text-[13px] text-[var(--muted)]">ціна одразу</span>
            </button>
          </div>
          {sizeCode === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-sm text-[var(--muted)]">Ширина, см
                <input id="op-w" type="number" inputMode="decimal" step={0.5} min={CFG.minWidthMm / 10} max={CFG.maxWidthMm / 10} value={customCm.w}
                  onChange={(e) => setCustomCm((c) => ({ ...c, w: Number(e.target.value) || 0 }))}
                  onBlur={() => setCustomCm({ w: size.widthMm / 10, h: size.heightMm / 10 })} className={input} />
              </label>
              <label className="grid gap-1 text-sm text-[var(--muted)]">Висота, см
                <input id="op-h" type="number" inputMode="decimal" step={0.5} min={CFG.minHeightMm / 10} max={CFG.maxHeightMm / 10} value={customCm.h}
                  onChange={(e) => setCustomCm((c) => ({ ...c, h: Number(e.target.value) || 0 }))}
                  onBlur={() => setCustomCm({ w: size.widthMm / 10, h: size.heightMm / 10 })} className={input} />
              </label>
              <span className="col-span-2 text-[13px] text-[var(--muted)]">Ширина від {cm(CFG.minWidthMm)} до {cm(CFG.maxWidthMm)} см, висота від {cm(CFG.minHeightMm)} до {cm(CFG.maxHeightMm)} см.</span>
            </div>
          )}
        </fieldset>

        <PlaqueLinesEditor state={text} legend="Текст для гравіювання" idPrefix="op" maxChars={CFG.maxLineChars}
          capByLine={new Map(layout.lines.map((l) => [l.index, l.capMm]))} />

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Пластина з гравіюванням</legend>
          <div role="radiogroup" aria-label="Колір пластини" className="flex flex-wrap gap-2.5">
            {PLAQUE_PLATE_COLOURS.map((c) => (
              <button key={c.id} id={`op-plate-${c.id}`} type="button" role="radio" aria-checked={plateId === c.id} title={c.name.uk} onClick={() => setPlateId(c.id)}
                className={`h-10 w-10 rounded-full border-2 ${plateId === c.id ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`}
                style={{ background: plateSwatch(c.hex, c.highlight, c.satin) }}><span className="sr-only">{c.name.uk}</span></button>
            ))}
          </div>
          <span className="text-[13px] text-[var(--muted)]">{plate.name.uk}, дзеркальна, напис гравіюється до темного шару</span>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Основа</legend>
          <div className="flex flex-wrap gap-2">
            {PLAQUE_BASE_COLOURS.map((c) => <PlaqueChip key={c.id} id={`op-base-${c.id}`} on={baseId === c.id} onClick={() => setBaseId(c.id)}>{c.name.uk}</PlaqueChip>)}
          </div>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Кількість</legend>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="op-qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Math.round(Number(e.target.value)) || 1)))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
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
            {price.lines.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[30px] font-extrabold leading-none tabular-nums">{formatUAH(price.total)}
              <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{qty > 1 ? `${formatUAH(price.unitPrice)} × ${qty} шт. · ` : ""}{dispatch}</small>
            </div>
            <button type="button" onClick={buy} disabled={!canBuy} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-40">{added ? "✓ Додано в кошик" : "В кошик"}</button>
          </div>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <b className="text-xl tabular-nums">{formatUAH(price.total)}</b>
        <button type="button" onClick={buy} disabled={!canBuy} className="h-12 rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] disabled:opacity-40">{added ? "✓ Додано" : "В кошик"}</button>
      </div>
    </div>
  );
}
