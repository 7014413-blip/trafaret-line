"use client";

// «Написи на планці» constructor (Денис 2026-10-10): words cut from one layer of acrylic, the
// letters of each word standing on a thin strip, so a word is one piece (a coffee shop menu on
// his photos). The customer types the lines and a price or number for each (its own piece),
// picks the font of every line (shop fonts and their own), capitals or not, the colour and
// the letter height, or the length of the widest row. Preview and price change at once.
// Layout: lib/joined-words/layout.ts, price: lib/joined-words/price.ts (repeated on the server).

import { useEffect, useMemo, useState } from "react";
import { JoinedWordsPreview } from "@/components/signage/JoinedWordsPreview";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { nextTierHint } from "@/lib/calculators/pricing";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { joinedWordsThumbnailSvg } from "@/lib/export/joined-words-thumbnail";
import { formatUAH } from "@/lib/format";
import { checkJoinedWords } from "@/lib/joined-words/check";
import { DEFAULT_JOINED_WORDS_CONFIG } from "@/lib/joined-words/config";
import { findJoinedWordsMaterial } from "@/lib/joined-words/find-material";
import { letterHeightForWidth } from "@/lib/joined-words/fit-length";
import { computeJoinedWordsLayout } from "@/lib/joined-words/layout";
import { JOINED_WORDS_MATERIALS } from "@/lib/joined-words/materials";
import { measureJoinedWordsDesign } from "@/lib/joined-words/measure-design";
import { priceJoinedWords } from "@/lib/joined-words/price";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { useCart } from "@/store/cart-store";
import type { JoinedLineMeasures, JoinedWordsDesign } from "@/types/joined-words";
import type { PlaqueTextLine } from "@/types/plaques";

const CFG = DEFAULT_JOINED_WORDS_CONFIG;
const FIRST_LINES: PlaqueTextLine[] = [
  { text: "ЛАТЕ ГАРБУЗОВИЙ", fontId: "oswald", size: 1 },
  { text: "СОЛОНА КАРАМЕЛЬ", fontId: "oswald", size: 1 },
  { text: "СІНАБОН", fontId: "oswald", size: 1 },
  { text: "ПОПКОРН", fontId: "oswald", size: 1 },
];
const FIRST_TAILS = ["110/160", "110/160", "100", "110"];
const HEIGHTS_CM = [3, 4, 5, 6, 8, 10];

const legend = "mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]";
const input = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
const swatch = (hex: string, mirror: boolean) => (mirror ? `linear-gradient(135deg, #f8fafc, ${hex} 45%, #f8fafc 60%, ${hex})` : hex);

export function JoinedWordsConstructor() {
  const text = usePlaqueLines(FIRST_LINES, CFG.maxLines);
  const [tails, setTails] = useState<string[]>(FIRST_TAILS);
  const [upper, setUpper] = useState(true);
  const [materialId, setMaterialId] = useState("black");
  const [letterMm, setLetterMm] = useState(50);
  const [letterInput, setLetterInput] = useState("5");
  const [widthInput, setWidthInput] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  // Shipping date only in the browser: server and browser format weekdays differently.
  const [dispatch, setDispatch] = useState("виготовлення 3 робочі дні");
  const cart = useCart();

  useEffect(() => setDispatch(formatDispatch(estimateDispatchDate(new Date()))), []);

  const design: JoinedWordsDesign = {
    materialId, letterHeightMm: letterMm, upper, quantity: qty,
    lines: text.lines.map((l, i) => ({
      text: l.text.replace(/\s+/g, " ").trim(), tail: (tails[i] ?? "").replace(/\s+/g, " ").trim(), fontId: l.fontId, size: l.size,
    })),
  };
  const designKey = JSON.stringify(design.lines) + String(upper);
  const { fontFor } = text;
  // Measured again only when the text, fonts or capitals change (fontFor changes with every loaded font).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const measured = useMemo(() => measureJoinedWordsDesign(design, fontFor, CFG), [designKey, fontFor]);
  const measures: JoinedLineMeasures[] = measured.map((m) => ({ text: m.text?.measure ?? null, tail: m.tail?.measure ?? null }));
  const ready = measured.every((m) => m.ready);
  const layout = computeJoinedWordsLayout(design, measures, CFG);
  const paths = new Map<string, string>();
  measured.forEach((m, i) => {
    if (m.text) paths.set(`${i}|text`, m.text.pathData);
    if (m.tail) paths.set(`${i}|tail`, m.tail.pathData);
  });
  const sheet = findJoinedWordsMaterial(materialId);
  const glyphs = measured.map((m) => ({
    missing: [...new Set([...(m.text?.missing ?? []), ...(m.tail?.missing ?? [])])],
    loose: [...new Set([...(m.text?.loose ?? []), ...(m.tail?.loose ?? [])])],
  }));
  const checks = ready ? checkJoinedWords(layout, sheet, glyphs, CFG) : [];
  const errors = checks.filter((c) => c.level === "error");
  const price = priceJoinedWords(design, layout, CFG);
  const hint = nextTierHint(qty);
  const canBuy = ready && errors.length === 0;

  const setHeight = (mm: number) => {
    const clamped = Math.min(CFG.maxLetterMm, Math.max(CFG.minLetterMm, Math.round(mm)));
    setLetterMm(clamped);
    setLetterInput(String(clamped / 10));
  };
  const fitWidth = () => {
    const target = Number(widthInput.replace(",", ".")) * 10;
    const fitted = letterHeightForWidth(design, measures, target, CFG);
    if (fitted) setHeight(fitted);
  };

  const buy = () => {
    if (!canBuy) return;
    const final = { ...design, lines: design.lines.filter((l) => l.text || l.tail) };
    const words = final.lines.map((l) => l.text || l.tail).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `words|${JSON.stringify({ ...final, quantity: 0 })}`,
      title: `Напис на планці «${words.length > 60 ? `${words.slice(0, 59)}…` : words}», літери ${cm(letterMm)} см, ${sheet.name.uk.toLowerCase()}`,
      materialId: "acrylic",
      widthCm: Math.round(layout.widthMm) / 10,
      heightCm: Math.round(layout.heightMm) / 10,
      quantity: qty,
      kind: "words",
      words: final,
      basePrice: price.internal.basePrice,
      vectorSvg: joinedWordsThumbnailSvg(layout, paths, sheet.hex),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label="Превʼю напису" className="self-start overflow-hidden rounded-2xl border border-[var(--line)] lg:sticky lg:top-24">
        <JoinedWordsPreview layout={layout} paths={paths} sheet={sheet} label={`Превʼю напису ${cm(layout.widthMm)}×${cm(layout.heightMm)} см`} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>Весь набір ≈ {cm(layout.widthMm)} × {cm(layout.heightMm)} см · {layout.pieces.length} дет.</span>
          <span>{sheet.name.uk}, {sheet.thicknessMm} мм</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <header>
          <p className="m-0 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Конструктор написів</p>
          <h1 className="m-0 mt-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,34px)] font-bold leading-tight">Написи на планці з акрилу</h1>
          <p className="mt-1.5 mb-0 text-[var(--muted)]">Кожне слово вирізаємо однією деталлю: літери стоять на тонкій планці. Меню для кавʼярні, назви зон, цитати на стіну. Ціна поруч з кожним рядком стане окремою деталлю.</p>
        </header>

        <PlaqueLinesEditor state={text} legend="Рядки" idPrefix="jw" maxChars={CFG.maxLineChars}
          capByLine={new Map(layout.pieces.map((p) => [p.lineIndex, p.capMm]))}
          onRemove={(i) => setTails((list) => list.filter((_, k) => k !== i))}
          renderExtra={(i) => (
            <label className="grid gap-1 text-sm text-[var(--muted)]">Ціна чи число окремою деталлю (необовʼязково)
              <input id={`jw-tail-${i}`} value={tails[i] ?? ""} maxLength={CFG.maxTailChars} placeholder="Напр. 110 або 110/160"
                onChange={(e) => setTails((list) => { const next = [...list]; while (next.length <= i) next.push(""); next[i] = e.target.value; return next; })}
                className={`${input} w-full min-w-0`} />
            </label>
          )} />

        <label className="flex items-center gap-2 text-sm">
          <input id="jw-upper" type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="h-5 w-5 accent-[var(--ink)]" />
          Лише великі літери
        </label>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Висота літер</legend>
          <div className="flex flex-wrap gap-2">
            {HEIGHTS_CM.map((v) => <PlaqueChip key={v} id={`jw-h-${v}`} on={letterMm === v * 10} onClick={() => setHeight(v * 10)}>{v} см</PlaqueChip>)}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-sm text-[var(--muted)]">Своя висота великих літер, см
              <input id="jw-height" type="number" inputMode="decimal" step={0.5} min={CFG.minLetterMm / 10} max={CFG.maxLetterMm / 10} value={letterInput}
                onChange={(e) => { setLetterInput(e.target.value); const v = Number(e.target.value.replace(",", ".")); if (v > 0) setLetterMm(Math.min(CFG.maxLetterMm, Math.max(CFG.minLetterMm, Math.round(v * 10)))); }}
                onBlur={() => setLetterInput(String(letterMm / 10))} className={`${input} w-full min-w-0`} />
            </label>
            <label className="grid gap-1 text-sm text-[var(--muted)]">Або довжина найширшого рядка, см
              <span className="flex min-w-0 gap-2">
                <input id="jw-width" type="number" inputMode="decimal" step={1} min={5} value={widthInput} placeholder={cm(layout.widthMm)}
                  onChange={(e) => setWidthInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fitWidth(); } }}
                  className={`${input} w-full min-w-0`} />
                <button id="jw-fit" type="button" onClick={fitWidth} disabled={!widthInput || !ready} className="h-11 shrink-0 rounded-xl border-[1.5px] border-[var(--ink)] px-3 text-sm font-semibold disabled:opacity-40">Підібрати</button>
              </span>
            </label>
          </div>
          <span className="text-[13px] text-[var(--muted)]">Від {cm(CFG.minLetterMm)} до {cm(CFG.maxLetterMm)} см. Розмір кожного рядка міняйте у полі «Розмір літер».</span>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Колір акрилу</legend>
          <div role="radiogroup" aria-label="Колір акрилу" className="flex flex-wrap gap-2.5">
            {JOINED_WORDS_MATERIALS.map((m) => (
              <button key={m.id} id={`jw-c-${m.id}`} type="button" role="radio" aria-checked={materialId === m.id} title={m.name.uk} onClick={() => setMaterialId(m.id)}
                className={`relative h-10 w-10 rounded-full border-2 ${materialId === m.id ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`}
                style={{ background: swatch(m.hex, m.mirror) }}>
                {!m.inStock && <span className="absolute -right-1 -bottom-1 rounded-full bg-[var(--card)] px-1 text-[9px] text-[var(--muted)]">зам.</span>}
                <span className="sr-only">{m.name.uk}</span>
              </button>
            ))}
          </div>
          <span className="text-[13px] text-[var(--muted)]">{sheet.name.uk}, {sheet.thicknessMm} мм, один шар{sheet.inStock ? "" : " · під замовлення"}. Усі кольори за однією ціною.</span>
        </fieldset>

        <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"><legend className={legend}>Кількість наборів</legend>
          <div className="flex items-center gap-1.5">
            <button type="button" aria-label="Менше" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
            <input id="jw-qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(9999, Math.round(Number(e.target.value)) || 1)))} aria-label="Кількість" className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
            <button type="button" aria-label="Більше" onClick={() => setQty(Math.min(9999, qty + 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
          </div>
          <span className="text-[13px] text-[var(--muted)]">Від 10 наборів −5%, від 50 −10%, від 100 −15%.{hint ? ` Додайте ще ${hint.addQty} шт., щоб отримати −${Math.round(hint.nextDiscount * 100)}%.` : ""}</span>
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
              <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{qty > 1 ? `${formatUAH(price.unitPrice)} × ${qty} наб. · ` : ""}{dispatch}</small>
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
