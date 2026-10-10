"use client";

// Wedding initials constructor (Денис 2026-10-10): two letters and a separator («S | D») cut from
// mirror acrylic, laid on the cake as separate pieces or joined on a strip with a skewer.
// The customer types the letters, picks the separator, the font (a Times-like serif by default,
// any shop font or their own), the letter height and the colour; preview and price at once.
// Layout: lib/initials/layout.ts, price: lib/initials/price.ts (repeated on the server).

import { useEffect, useMemo, useState } from "react";
import { CustomFontPanel } from "@/components/constructor/CustomFontPanel";
import { InitialsPreview } from "@/components/signage/InitialsPreview";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { nextTierHint } from "@/lib/calculators/pricing";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { initialsThumbnailSvg } from "@/lib/export/initials-thumbnail";
import { formatUAH } from "@/lib/format";
import { checkInitials } from "@/lib/initials/check";
import { DEFAULT_INITIALS_CONFIG } from "@/lib/initials/config";
import { computeInitialsLayout } from "@/lib/initials/layout";
import { measureInitials, type MeasuredInitials } from "@/lib/initials/measure";
import { priceInitials } from "@/lib/initials/price";
import { findJoinedWordsMaterial } from "@/lib/joined-words/find-material";
import { JOINED_WORDS_MATERIALS } from "@/lib/joined-words/materials";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { useCart } from "@/store/cart-store";
import type { InitialsDesign, InitialsMode, InitialsSeparator } from "@/types/initials";

const CFG = DEFAULT_INITIALS_CONFIG;
const SEPARATORS: [InitialsSeparator, string][] = [["bar", "S | D"], ["amp", "S & D"], ["plus", "S + D"], ["dot", "S · D"], ["none", "SD"]];
const MODES: [InitialsMode, string, string][] = [
  ["pieces", "Окремими деталями", "Літери і риска лягають на торт, як на фото"],
  ["topper", "Топпером зі шпажкою", "Усе на тонкій планці, стоїть у торті"],
];
const HEIGHTS_CM = [5, 7, 10, 12, 15];
// Mirror sheets first: they are what wedding initials are made of.
const SHEETS = [...JOINED_WORDS_MATERIALS.filter((m) => m.mirror), ...JOINED_WORDS_MATERIALS.filter((m) => !m.mirror)];

const legend = "mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]";
const input = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
const swatch = (hex: string, mirror: boolean) => (mirror ? `linear-gradient(135deg, #f8fafc, ${hex} 45%, #f8fafc 60%, ${hex})` : hex);
const EMPTY: MeasuredInitials = { first: null, second: null, sep: null };

export function InitialsConstructor() {
  const [first, setFirst] = useState("S");
  const [second, setSecond] = useState("D");
  const [separator, setSeparator] = useState<InitialsSeparator>("bar");
  const [mode, setMode] = useState<InitialsMode>("pieces");
  const [letterMm, setLetterMm] = useState(100);
  const [letterInput, setLetterInput] = useState("10");
  const [materialId, setMaterialId] = useState("mirror-gold");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // Shipping date only in the browser: server and browser format weekdays differently.
  const [dispatch, setDispatch] = useState("виготовлення 3 робочі дні");
  const fonts = usePlaqueLines([{ text: "SD", fontId: "pt-serif", size: 1 }], 1);
  const cart = useCart();
  const fontId = fonts.lines[0].fontId;
  const { setLine, fontFor } = fonts;

  useEffect(() => setDispatch(formatDispatch(estimateDispatchDate(new Date()))), []);
  // The font panel checks the customer's font against the letters typed here.
  useEffect(() => setLine(0, { text: `${first}${second}&+` }), [first, second, setLine]);

  const design: InitialsDesign = {
    first: first.replace(/\s+/g, ""), second: second.replace(/\s+/g, ""), separator, fontId,
    letterHeightMm: letterMm, materialId, mode, quantity: qty,
  };
  const font = fontFor(fontId);
  const measured = useMemo(() => (font ? measureInitials(design, font) : EMPTY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [font, design.first, design.second, design.separator]);
  const layout = computeInitialsLayout(design, measured, CFG);
  const paths = new Map<string, string>();
  if (measured.first) paths.set("first", measured.first.pathData);
  if (measured.second) paths.set("second", measured.second.pathData);
  if (measured.sep) paths.set("sep", measured.sep.pathData);
  const sheet = findJoinedWordsMaterial(materialId);
  const checks = font ? checkInitials(design, measured, CFG) : [];
  const errors = checks.filter((c) => c.level === "error");
  const price = priceInitials(design, layout, CFG);
  const hint = nextTierHint(qty);
  const canBuy = !!font && errors.length === 0;

  const setHeight = (mm: number) => {
    const clamped = Math.min(CFG.maxLetterMm, Math.max(CFG.minLetterMm, Math.round(mm)));
    setLetterMm(clamped);
    setLetterInput(String(clamped / 10));
  };

  const buy = () => {
    if (!canBuy) return;
    const sep = SEPARATORS.find(([v]) => v === separator)?.[1].replace("S", design.first).replace("D", design.second) ?? `${design.first}${design.second}`;
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `initials|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: `Ініціали на торт «${sep}», літери ${cm(letterMm)} см, ${sheet.name.uk.toLowerCase()}${mode === "topper" ? ", топпер" : ""}`,
      materialId: "acrylic",
      widthCm: Math.round(layout.widthMm) / 10,
      heightCm: Math.round(layout.heightMm) / 10,
      quantity: qty,
      kind: "initials",
      initials: design,
      basePrice: price.internal.basePrice,
      vectorSvg: initialsThumbnailSvg(layout, paths, sheet.hex),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const fontOptions = fonts.allFonts.length
    ? fonts.allFonts.map((f) => <option key={f.id} value={f.id}>{f.custom ? `Ваш: ${f.name}` : f.name}</option>)
    : <option value={fontId}>Шрифти завантажуються…</option>;

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Превʼю ініціалів" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] lg:sticky lg:top-24">
        <InitialsPreview layout={layout} paths={paths} sheet={sheet} label={`Превʼю ініціалів ${cm(layout.widthMm)}×${cm(layout.heightMm)} см`} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{cm(layout.widthMm)} × {cm(layout.heightMm)} см · літери {cm(letterMm)} см</span>
          <span>{sheet.name.uk}, {sheet.thicknessMm} мм</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Весільний декор</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">Ініціали на весільний торт</h1>
          <p className="mt-1.5 mb-0 text-[var(--muted)]">Перші літери імен з дзеркального акрилу: золото, срібло чи будь-який колір. Свій розмір і шрифт, ціна одразу.</p>
        </header>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Літери</legend>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
            <label className="grid gap-1 text-sm text-[var(--muted)]">Перша
              <input id="in-first" value={first} maxLength={CFG.maxChars} onChange={(e) => setFirst(e.target.value)} className={`${input} h-14 w-full min-w-0 text-center text-2xl`} />
            </label>
            <label className="grid gap-1 text-sm text-[var(--muted)]">Друга
              <input id="in-second" value={second} maxLength={CFG.maxChars} onChange={(e) => setSecond(e.target.value)} className={`${input} h-14 w-full min-w-0 text-center text-2xl`} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {SEPARATORS.map(([v, name]) => <PlaqueChip key={v} id={`in-sep-${v}`} on={separator === v} onClick={() => setSeparator(v)}>{name}</PlaqueChip>)}
          </div>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Шрифт</legend>
          <select id="in-font" value={fontId} onChange={(e) => setLine(0, { fontId: e.target.value })} className={`${input} w-full min-w-0`}>{fontOptions}</select>
          <span className="text-[13px] text-[var(--muted)]">PT Serif схожий на класичний Times, як на прикладі. Можна взяти будь-який інший або свій.</span>
          <CustomFontPanel fonts={fonts.customFonts} text={`${first}${second}`}
            onAdded={(f) => { fonts.onFontAdded(f); setLine(0, { fontId: f.id }); }} onRemoved={fonts.onFontRemoved} />
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Висота літер</legend>
          <div className="flex flex-wrap gap-2">
            {HEIGHTS_CM.map((v) => <PlaqueChip key={v} id={`in-h-${v}`} on={letterMm === v * 10} onClick={() => setHeight(v * 10)}>{v} см</PlaqueChip>)}
          </div>
          <label className="grid gap-1 text-sm text-[var(--muted)]">Своя висота, см
            <input id="in-height" type="number" inputMode="decimal" step={0.5} min={CFG.minLetterMm / 10} max={CFG.maxLetterMm / 10} value={letterInput}
              onChange={(e) => { setLetterInput(e.target.value); const v = Number(e.target.value.replace(",", ".")); if (v > 0) setLetterMm(Math.min(CFG.maxLetterMm, Math.max(CFG.minLetterMm, Math.round(v * 10)))); }}
              onBlur={() => setLetterInput(String(letterMm / 10))} className={`${input} w-full min-w-0`} />
          </label>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Як ставити на торт</legend>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
            {MODES.map(([v, name, note]) => (
              <button key={v} id={`in-mode-${v}`} type="button" aria-pressed={mode === v} onClick={() => setMode(v)}
                className={`grid gap-0.5 rounded-xl border-[1.5px] px-3 py-2 text-left ${mode === v ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                <b className="text-[15px]">{name}</b><span className="text-[13px] text-[var(--muted)]">{note}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Колір</legend>
          <div role="radiogroup" aria-label="Колір акрилу" className="flex flex-wrap gap-2.5">
            {SHEETS.map((m) => (
              <button key={m.id} id={`in-c-${m.id}`} type="button" role="radio" aria-checked={materialId === m.id} title={m.name.uk} onClick={() => setMaterialId(m.id)}
                className={`relative h-10 w-10 rounded-full border-2 ${materialId === m.id ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`}
                style={{ background: swatch(m.hex, m.mirror) }}>
                {!m.inStock && <span className="absolute -right-1 -bottom-1 rounded-full bg-[var(--card)] px-1 text-[9px] text-[var(--muted)]">зам.</span>}
                <span className="sr-only">{m.name.uk}</span>
              </button>
            ))}
          </div>
          <span className="text-[13px] text-[var(--muted)]">{sheet.name.uk}, {sheet.thicknessMm} мм{sheet.inStock ? "" : " · під замовлення"}.</span>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Кількість</legend>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="in-qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Math.round(Number(e.target.value)) || 1)))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
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
