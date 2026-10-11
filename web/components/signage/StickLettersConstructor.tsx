"use client";

// Self-adhesive letters constructor (Денис 2026-10-10): words for card boxes, wedding gifts and
// postcards cut from 3 mm acrylic with tape on the back, a cardboard stencil to glue them straight.
// The same constructor makes single acrylic numbers and letters 2–80 cm (product "chars",
// Денис 2026-10-11), with or without self-adhesive and without the stencil.
// The customer types up to 6 lines, picks a font and size for every line (swap the font and see it
// at once), joined or separate letters, the letter height and the colour. Preview on a box lid and
// of the stencil; price at once. Layout: lib/stick-letters/layout.ts, price: lib/stick-letters/price.ts
// (repeated on the server with its own fonts).

import { useEffect, useMemo, useState } from "react";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { StickLettersPreview, type StickLettersView } from "@/components/signage/StickLettersPreview";
import { nextTierHint } from "@/lib/calculators/pricing";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { stickLettersThumbnailSvg } from "@/lib/export/stick-letters-thumbnail";
import { formatUAH } from "@/lib/format";
import { findJoinedWordsMaterial } from "@/lib/joined-words/find-material";
import { JOINED_WORDS_MATERIALS } from "@/lib/joined-words/materials";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { checkStickLetters } from "@/lib/stick-letters/check";
import { stickLettersConfigFor } from "@/lib/stick-letters/config-for";
import { computeStickLettersLayout } from "@/lib/stick-letters/layout";
import { measureStickLine } from "@/lib/stick-letters/measure-line";
import { priceStickLetters } from "@/lib/stick-letters/price";
import { useCart } from "@/store/cart-store";
import type { StickLettersDesign, StickLettersProduct } from "@/types/stick-letters";
import type { PlaqueTextLine } from "@/types/plaques";

/** Texts, sizes and starting design of each product. */
const PRODUCT_UI: Record<StickLettersProduct, {
  kicker: string; heading: string; intro: string; heightsCm: number[]; startMm: number; startSheet: string;
  startLines: PlaqueTextLine[]; startJoined: boolean[]; cartName: string;
}> = {
  letters: {
    kicker: "Весільний декор і подарунки",
    heading: "Самоклейні літери з акрилу",
    intro: "Напис для коробки з листівками, подарунка чи столу: обʼємні літери 3 мм зі скотчем на звороті. Картонний трафарет для рівної поклейки вже в ціні.",
    heightsCm: [2, 3, 4, 5, 7, 10],
    startMm: 40,
    startSheet: "black",
    startLines: [
      { text: "ПОДАРУНКИ", fontId: "playfair", size: 1 },
      { text: "та", fontId: "pacifico", size: 0.8 },
      { text: "ЛИСТІВКИ", fontId: "playfair", size: 1 },
    ],
    startJoined: [false, true, false],
    cartName: "Самоклейні літери",
  },
  chars: {
    kicker: "Декор і навігація",
    heading: "Акрилові цифри і літери",
    intro: "Окремі цифри і літери з акрилу 3 мм заввишки від 2 до 80 см: номер будинку чи квартири, дата, ініціали, декор. Будь-який колір і шрифт, зі скотчем на звороті або без.",
    heightsCm: [2, 5, 10, 20, 30, 50, 80],
    startMm: 100,
    startSheet: "mirror-gold",
    startLines: [{ text: "2026", fontId: "playfair", size: 1 }],
    startJoined: [false],
    cartName: "Акрилові цифри і літери",
  },
};
// Black, white and mirror first: what card boxes and wedding gifts are made with.
const FIRST = ["black", "white", "mirror-gold", "mirror-silver"];
const SHEETS = [...FIRST.map((id) => JOINED_WORDS_MATERIALS.find((m) => m.id === id)).filter((m) => m !== undefined), ...JOINED_WORDS_MATERIALS.filter((m) => !FIRST.includes(m.id))];

const legend = "mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]";
const input = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
const swatch = (hex: string, mirror: boolean) => (mirror ? `linear-gradient(135deg, #f8fafc, ${hex} 45%, #f8fafc 60%, ${hex})` : hex);

export function StickLettersConstructor({ product = "letters" }: { product?: StickLettersProduct }) {
  const CFG = stickLettersConfigFor(product);
  const ui = PRODUCT_UI[product];
  const [joined, setJoined] = useState<boolean[]>(ui.startJoined);
  const [letterMm, setLetterMm] = useState(ui.startMm);
  const [letterInput, setLetterInput] = useState(String(ui.startMm / 10));
  const [materialId, setMaterialId] = useState(ui.startSheet);
  const [adhesive, setAdhesive] = useState(true);
  const [view, setView] = useState<StickLettersView>("box");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // Shipping date only in the browser: server and browser format weekdays differently.
  const [dispatch, setDispatch] = useState("виготовлення 3 робочі дні");
  const fonts = usePlaqueLines(ui.startLines, CFG.maxLines);
  const cart = useCart();
  const { fontFor } = fonts;

  useEffect(() => setDispatch(formatDispatch(estimateDispatchDate(new Date()))), []);

  const design: StickLettersDesign = {
    product, adhesive: CFG.rateNoAdhesivePerM2 == null ? true : adhesive,
    materialId, letterHeightMm: letterMm, upper: false, quantity: qty,
    lines: fonts.lines.map((line, i) => ({ ...line, joined: CFG.joinable && (joined[i] ?? false) })),
  };
  const measured = useMemo(
    () => fonts.lines.map((line) => { const font = fontFor(line.fontId); return font ? measureStickLine(font, line.text, false) : null; }),
    [fonts.lines, fontFor],
  );
  const layout = computeStickLettersLayout(design, measured.map((m) => m?.measure ?? null), CFG);
  const paths = new Map<number, string>();
  measured.forEach((m, i) => { if (m) paths.set(i, m.pathData); });
  const sheet = findJoinedWordsMaterial(materialId);
  const checks = checkStickLetters(layout, measured.map((m) => m?.missing ?? []), CFG);
  const errors = checks.filter((c) => c.level === "error");
  const price = priceStickLetters(design, layout, CFG);
  const hint = nextTierHint(qty);
  const canBuy = fonts.fontsReady && errors.length === 0;
  const capByLine = new Map(layout.lines.map((l) => [l.index, l.capMm]));

  const setHeight = (mm: number) => {
    const clamped = Math.min(CFG.maxLetterMm, Math.max(Math.floor(CFG.minLetterMm / 1.6), Math.round(mm)));
    setLetterMm(clamped);
    setLetterInput(String(clamped / 10));
  };
  const setLineJoined = (i: number, value: boolean) => setJoined((list) => {
    const next = [...list];
    while (next.length <= i) next.push(false);
    next[i] = value;
    return next;
  });
  const onLineRemoved = (i: number) => setJoined((list) => list.filter((_, k) => k !== i));

  const buy = () => {
    if (!canBuy) return;
    const text = design.lines.map((l) => l.text.trim()).filter(Boolean).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `letters|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: `${ui.cartName} «${text}», ${cm(layout.widthMm)}×${cm(layout.heightMm)} см, ${sheet.name.uk.toLowerCase()}${design.adhesive ? "" : ", без самоклейки"}`,
      materialId: "acrylic",
      widthCm: Math.round(layout.widthMm) / 10,
      heightCm: Math.round(layout.heightMm) / 10,
      quantity: qty,
      kind: "letters",
      letters: design,
      basePrice: price.internal.basePrice,
      vectorSvg: stickLettersThumbnailSvg(layout, paths, sheet.hex),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Превʼю літер" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] lg:sticky lg:top-24">
        <StickLettersPreview layout={layout} paths={paths} sheet={sheet} view={CFG.stencil ? view : "box"} label={`Превʼю самоклейних літер ${cm(layout.widthMm)}×${cm(layout.heightMm)} см`} />
        {CFG.stencil && (
          <div className="flex gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 pt-2.5">
            <PlaqueChip id="sl-view-box" on={view === "box"} onClick={() => setView("box")}>На коробці</PlaqueChip>
            <PlaqueChip id="sl-view-stencil" on={view === "stencil"} onClick={() => setView("stencil")}>Трафарет для поклейки</PlaqueChip>
          </div>
        )}
        <div className={`flex flex-wrap justify-between gap-2 bg-[var(--card)] px-3.5 py-2.5 ${CFG.stencil ? "" : "border-t border-[var(--line)]"} text-[13px] text-[var(--muted)] tabular-nums`}>
          <span>{cm(layout.widthMm)} × {cm(layout.heightMm)} см · {layout.pieces.length} дет.</span>
          <span>{sheet.name.uk}, {CFG.thicknessMm} мм</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">{ui.kicker}</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">{ui.heading}</h1>
          <p className="mt-1.5 mb-0 text-[var(--muted)]">{ui.intro}</p>
        </header>

        <PlaqueLinesEditor state={fonts} legend="Напис" idPrefix="sl" maxChars={CFG.maxLineChars} capByLine={capByLine} onRemove={onLineRemoved}
          renderExtra={(i) => CFG.joinable && (
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id={`sl-line-${i}-apart`} on={!(joined[i] ?? false)} onClick={() => setLineJoined(i, false)}>Окремі літери</PlaqueChip>
              <PlaqueChip id={`sl-line-${i}-joined`} on={joined[i] ?? false} onClick={() => setLineJoined(i, true)}>Злите слово</PlaqueChip>
            </div>
          )} />

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Висота літер</legend>
          <div className="flex flex-wrap gap-2">
            {ui.heightsCm.map((v) => <PlaqueChip key={v} id={`sl-h-${v}`} on={letterMm === v * 10} onClick={() => setHeight(v * 10)}>{v} см</PlaqueChip>)}
          </div>
          <label className="grid gap-1 text-sm text-[var(--muted)]">Своя висота великої літери, см
            <input id="sl-height" type="number" inputMode="decimal" step={0.5} min={1} max={CFG.maxLetterMm / 10} value={letterInput}
              onChange={(e) => { setLetterInput(e.target.value); const v = Number(e.target.value.replace(",", ".")); if (v > 0) setLetterMm(Math.min(CFG.maxLetterMm, Math.max(Math.floor(CFG.minLetterMm / 1.6), Math.round(v * 10)))); }}
              onBlur={() => setLetterInput(String(letterMm / 10))} className={`${input} w-full min-w-0`} />
          </label>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Колір</legend>
          <div role="radiogroup" aria-label="Колір акрилу" className="flex flex-wrap gap-2.5">
            {SHEETS.map((m) => (
              <button key={m.id} id={`sl-c-${m.id}`} type="button" role="radio" aria-checked={materialId === m.id} title={m.name.uk} onClick={() => setMaterialId(m.id)}
                className={`relative h-10 w-10 rounded-full border-2 ${materialId === m.id ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`}
                style={{ background: swatch(m.hex, m.mirror) }}>
                {!m.inStock && <span className="absolute -right-1 -bottom-1 rounded-full bg-[var(--card)] px-1 text-[9px] text-[var(--muted)]">зам.</span>}
                <span className="sr-only">{m.name.uk}</span>
              </button>
            ))}
          </div>
          <span className="text-[13px] text-[var(--muted)]">{sheet.name.uk}, {CFG.thicknessMm} мм{sheet.inStock ? "" : " · під замовлення"}.</span>
        </fieldset>

        {CFG.rateNoAdhesivePerM2 != null && (
          <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Кріплення</legend>
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id="sl-adh-on" on={adhesive} onClick={() => setAdhesive(true)}>Зі скотчем на звороті</PlaqueChip>
              <PlaqueChip id="sl-adh-off" on={!adhesive} onClick={() => setAdhesive(false)}>Без скотчу</PlaqueChip>
            </div>
          </fieldset>
        )}

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Кількість наборів</legend>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="sl-qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Math.round(Number(e.target.value)) || 1)))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
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
