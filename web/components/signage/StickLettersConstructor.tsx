"use client";

// Self-adhesive letters constructor (Денис 2026-10-10): words for card boxes, wedding gifts and
// postcards cut from 3 mm acrylic with tape on the back, a cardboard stencil to glue them straight.
// The same constructor makes single acrylic numbers and letters 2–80 cm (product "chars",
// Денис 2026-10-11), with or without self-adhesive and without the stencil, and separate
// self-adhesive letters 2–20 cm for ads and signs (product "sign-letters", Денис 2026-10-11):
// black or white and mirror sheets at their own rates, capitals and small letters.
// The customer types up to 6 lines, picks a font and size for every line (swap the font and see it
// at once), joined or separate letters, the letter height and the colour. Preview on a box lid and
// of the stencil; price at once. Layout: lib/stick-letters/layout.ts, price: lib/stick-letters/price.ts
// (repeated on the server with its own fonts).

import { useMemo, useState } from "react";
import { BuyPanel } from "@/components/signage/BuyPanel";
import { ConstructorHeader } from "@/components/signage/ConstructorHeader";
import { DesignChecks } from "@/components/signage/DesignChecks";
import { LetterHeightField } from "@/components/signage/LetterHeightField";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { QuantityField } from "@/components/signage/QuantityField";
import { SheetSwatches } from "@/components/signage/SheetSwatches";
import { StickLettersPreview, type StickLettersView } from "@/components/signage/StickLettersPreview";
import { FIELDSET_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { useBuyState } from "@/lib/client/use-buy-state";
import { useDispatchLabel } from "@/lib/client/use-dispatch-label";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { stickLettersThumbnailSvg } from "@/lib/export/stick-letters-thumbnail";
import { cmText, formatUAH } from "@/lib/format";
import { findJoinedWordsMaterial } from "@/lib/joined-words/find-material";
import { JOINED_WORDS_MATERIALS } from "@/lib/joined-words/materials";
import { addDigits } from "@/lib/stick-letters/add-digits";
import { checkStickLetters } from "@/lib/stick-letters/check";
import { stickLettersConfigFor } from "@/lib/stick-letters/config-for";
import { countDigits, DIGITS } from "@/lib/stick-letters/count-digits";
import { computeStickLettersLayout } from "@/lib/stick-letters/layout";
import { measureStickLine } from "@/lib/stick-letters/measure-line";
import { priceStickLetters } from "@/lib/stick-letters/price";
import { stickPiecePrices } from "@/lib/stick-letters/piece-prices";
import { removeDigit } from "@/lib/stick-letters/remove-digit";
import { useCart } from "@/store/cart-store";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { SIGNAGE_LETTERS } from "@/lib/i18n/dictionaries/signage-letters";
import { tr } from "@/lib/i18n/translate";
import type { StickLettersDesign, StickLettersProduct } from "@/types/stick-letters";
import type { PlaqueTextLine } from "@/types/plaques";

/** Sizes and starting design of each product; its texts and start lines are in the dictionary. */
const PRODUCT_UI: Record<StickLettersProduct, {
  heightsCm: number[]; startMm: number; startSheet: string; startFonts: Omit<PlaqueTextLine, "text">[]; startJoined: boolean[];
}> = {
  letters: {
    heightsCm: [2, 3, 4, 5, 7, 10],
    startMm: 40,
    startSheet: "black",
    startFonts: [
      { fontId: "playfair", size: 1 },
      { fontId: "pacifico", size: 0.8 },
      { fontId: "playfair", size: 1 },
    ],
    startJoined: [false, true, false],
  },
  chars: {
    heightsCm: [2, 5, 10, 20, 30, 50, 80],
    startMm: 100,
    startSheet: "mirror-gold",
    // PT Serif: digits as tall as capitals (Playfair has old-style figures of different heights).
    startFonts: [{ fontId: "pt-serif", size: 1 }],
    startJoined: [false],
  },
  "sign-letters": {
    heightsCm: [2, 3, 5, 7, 10, 15, 20],
    startMm: 70,
    startSheet: "black",
    startFonts: [{ fontId: "pt-serif", size: 1 }],
    startJoined: [false],
  },
};
// Black, white and mirror first: what card boxes and wedding gifts are made with.
const FIRST = ["black", "white", "mirror-gold", "mirror-silver"];
const ALL_SHEETS = [...FIRST.map((id) => JOINED_WORDS_MATERIALS.find((m) => m.id === id)).filter((m) => m !== undefined), ...JOINED_WORDS_MATERIALS.filter((m) => !FIRST.includes(m.id))];


export function StickLettersConstructor({ product = "letters" }: { product?: StickLettersProduct }) {
  const CFG = stickLettersConfigFor(product);
  const ui = PRODUCT_UI[product];
  const locale = useLocale();
  const t = tr(SIGNAGE_LETTERS, locale).stickLetters;
  const tp = t.products[product];
  const ts = tr(SIGNAGE, locale);
  const sheets = CFG.materialIds
    ? CFG.materialIds.map((id) => JOINED_WORDS_MATERIALS.find((m) => m.id === id)).filter((m) => m !== undefined)
    : ALL_SHEETS;
  const [joined, setJoined] = useState<boolean[]>(ui.startJoined);
  const [letterMm, setLetterMm] = useState(ui.startMm);
  const [materialId, setMaterialId] = useState(ui.startSheet);
  const [adhesive, setAdhesive] = useState(true);
  const [upper, setUpper] = useState(false);
  const [view, setView] = useState<StickLettersView>("box");
  const [qty, setQty] = useState(1);
  const buyState = useBuyState();
  const dispatch = useDispatchLabel(locale);
  const fonts = usePlaqueLines(ui.startFonts.map((f, i) => ({ ...f, text: tp.startLines[i] ?? "" })), CFG.maxLines);
  const cart = useCart();
  const { fontFor } = fonts;

  const design: StickLettersDesign = {
    product, adhesive: CFG.rateNoAdhesivePerM2 == null ? true : adhesive,
    materialId, letterHeightMm: letterMm, upper: CFG.caseChoice && upper, quantity: qty,
    lines: fonts.lines.map((line, i) => ({ ...line, joined: CFG.joinable && (joined[i] ?? false) })),
  };
  const measured = useMemo(
    () => fonts.lines.map((line) => { const font = fontFor(line.fontId); return font ? measureStickLine(font, line.text, design.upper) : null; }),
    [fonts.lines, fontFor, design.upper],
  );
  const layout = computeStickLettersLayout(design, measured.map((m) => m?.measure ?? null), CFG);
  const paths = new Map<number, string>();
  measured.forEach((m, i) => { if (m) paths.set(i, m.pathData); });
  const sheet = findJoinedWordsMaterial(materialId);
  const checks = checkStickLetters(layout, measured.map((m) => m?.missing ?? []), CFG);
  const errors = checks.filter((c) => c.level === "error");
  const price = priceStickLetters(design, layout, CFG, undefined, locale);
  const piecePrices = CFG.joinable ? [] : stickPiecePrices(layout, design.adhesive, materialId, CFG);
  const canBuy = fonts.fontsReady && errors.length === 0;
  const capByLine = new Map(layout.lines.map((l) => [l.index, l.capMm]));

  const setLineJoined = (i: number, value: boolean) => setJoined((list) => {
    const next = [...list];
    while (next.length <= i) next.push(false);
    next[i] = value;
    return next;
  });
  // Digit picker: «+» adds the digit to the end of the first line, «−» takes away the last one typed.
  const digitCounts = countDigits(fonts.lines.map((l) => l.text));
  const plusDigits = (digits: string) => {
    const next = addDigits(fonts.lines[0]?.text ?? "", digits, CFG.maxLineChars);
    if (next != null) fonts.setLine(0, { text: next });
  };
  const minusDigit = (digit: string) => {
    const change = removeDigit(fonts.lines.map((l) => l.text), digit);
    if (change) fonts.setLine(change.index, { text: change.text });
  };
  const firstLineFull = (fonts.lines[0]?.text.length ?? 0) >= CFG.maxLineChars;
  const onLineRemoved = (i: number) => setJoined((list) => list.filter((_, k) => k !== i));

  const buy = () => {
    if (!canBuy) return;
    const text = design.lines.map((l) => l.text.trim()).filter(Boolean).join(" / ");
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `letters|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: t.cartTitle(tp.cartName, text, cmText(layout.widthMm), cmText(layout.heightMm), sheet.name[locale].toLowerCase(), design.adhesive, design.upper),
      materialId: "acrylic",
      widthCm: Math.round(layout.widthMm) / 10,
      heightCm: Math.round(layout.heightMm) / 10,
      quantity: qty,
      kind: "letters",
      letters: design,
      basePrice: price.internal.basePrice,
      vectorSvg: stickLettersThumbnailSvg(layout, paths, sheet.hex),
    });
    buyState.added();
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label={t.previewRegion} className="self-start overflow-hidden rounded-2xl border border-[var(--line)] lg:sticky lg:top-24">
        <StickLettersPreview layout={layout} paths={paths} sheet={sheet} view={CFG.stencil ? view : "box"} label={t.previewLabel(cmText(layout.widthMm), cmText(layout.heightMm))} />
        {CFG.stencil && (
          <div className="flex gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 pt-2.5">
            <PlaqueChip id="sl-view-box" on={view === "box"} onClick={() => setView("box")}>{t.viewBox}</PlaqueChip>
            <PlaqueChip id="sl-view-stencil" on={view === "stencil"} onClick={() => setView("stencil")}>{t.viewStencil}</PlaqueChip>
          </div>
        )}
        <div className={`flex flex-wrap justify-between gap-2 bg-[var(--card)] px-3.5 py-2.5 ${CFG.stencil ? "" : "border-t border-[var(--line)]"} text-[13px] text-[var(--muted)] tabular-nums`}>
          <span>{cmText(layout.widthMm)} × {cmText(layout.heightMm)} см · {layout.pieces.length} {ts.piecesShort}</span>
          <span>{ts.sheetThickness(sheet.name[locale], CFG.thicknessMm)}</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <ConstructorHeader kicker={tp.kicker} title={tp.heading} lead={tp.intro} />

        {product === "chars" && (
          <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.digitsLegend}</legend>
            <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-2">
              {DIGITS.map((d) => (
                <div key={d} className={`grid justify-items-center gap-1 rounded-xl border-[1.5px] px-1 py-2 ${digitCounts[d] > 0 ? "border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                  <span className="text-2xl font-bold leading-none">{d}</span>
                  <span id={`sl-d-${d}-count`} className="text-[12px] text-[var(--muted)] tabular-nums">{digitCounts[d]} шт.</span>
                  <div className="flex gap-1">
                    <button id={`sl-d-${d}-minus`} type="button" aria-label={t.removeDigit(d)} disabled={digitCounts[d] === 0} onClick={() => minusDigit(d)}
                      className="h-8 w-8 rounded-lg border border-[var(--line)] bg-[var(--card)] disabled:opacity-30">−</button>
                    <button id={`sl-d-${d}-plus`} type="button" aria-label={t.addDigit(d)} disabled={firstLineFull} onClick={() => plusDigits(d)}
                      className="h-8 w-8 rounded-lg border border-[var(--line)] bg-[var(--card)] disabled:opacity-30">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id="sl-d-all" on={false} onClick={() => plusDigits(DIGITS.join(""))}>{t.fullSet}</PlaqueChip>
              <PlaqueChip id="sl-d-clear" on={false} onClick={() => fonts.lines.forEach((_, i) => fonts.setLine(i, { text: "" }))}>{t.clear}</PlaqueChip>
            </div>
            <span className="text-[13px] text-[var(--muted)]">{t.digitsNote}</span>
          </fieldset>
        )}

        <PlaqueLinesEditor state={fonts} legend={ts.text} idPrefix="sl" maxChars={CFG.maxLineChars} capByLine={capByLine} onRemove={onLineRemoved}
          renderExtra={(i) => CFG.joinable && (
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id={`sl-line-${i}-apart`} on={!(joined[i] ?? false)} onClick={() => setLineJoined(i, false)}>{t.apart}</PlaqueChip>
              <PlaqueChip id={`sl-line-${i}-joined`} on={joined[i] ?? false} onClick={() => setLineJoined(i, true)}>{t.joined}</PlaqueChip>
            </div>
          )} />

        {CFG.caseChoice && (
          <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.letters}</legend>
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id="sl-case-as-typed" on={!upper} onClick={() => setUpper(false)}>{t.caseAsTyped}</PlaqueChip>
              <PlaqueChip id="sl-case-upper" on={upper} onClick={() => setUpper(true)}>{t.caseUpper}</PlaqueChip>
            </div>
            <span className="text-[13px] text-[var(--muted)]">{t.caseNote}</span>
          </fieldset>
        )}

        <LetterHeightField idPrefix="sl" heightsCm={ui.heightsCm} valueMm={letterMm} minMm={Math.floor(CFG.minLetterMm / 1.6)} maxMm={CFG.maxLetterMm}
          onChange={setLetterMm} inputLabel={t.capHeightInput} />

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{ts.colour}</legend>
          <SheetSwatches sheets={sheets} value={materialId} onChange={setMaterialId} idPrefix="sl-c" label={ts.acrylicColour} />
          <span className="text-[13px] text-[var(--muted)]">{ts.sheetThickness(sheet.name[locale], CFG.thicknessMm)}{sheet.inStock ? "" : ts.toOrder}.</span>
        </fieldset>

        {CFG.rateNoAdhesivePerM2 != null && (
          <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.mounting}</legend>
            <div className="flex flex-wrap gap-2">
              <PlaqueChip id="sl-adh-on" on={adhesive} onClick={() => setAdhesive(true)}>{t.withTape}</PlaqueChip>
              <PlaqueChip id="sl-adh-off" on={!adhesive} onClick={() => setAdhesive(false)}>{t.noTape}</PlaqueChip>
            </div>
          </fieldset>
        )}

        <QuantityField legend={ts.setsQuantity} idPrefix="sl" value={qty} onChange={setQty} />

        <DesignChecks checks={checks} />

        <BuyPanel lines={price.lines.map((label) => ({ label }))} total={price.total} unitPrice={price.unitPrice} qty={qty} note={dispatch}
          state={buyState.state} canBuy={canBuy} onBuy={buy}>
          {piecePrices.length > 0 && (
            <table id="sl-piece-prices" className="w-full border-collapse text-[13px] tabular-nums">
              <caption className="pb-1 text-left text-[13px] font-bold">{t.piecePricesCaption}</caption>
              <tbody>
                {piecePrices.map((p) => (
                  <tr key={`${p.text}|${p.widthMm}|${p.heightMm}`} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-1 pr-2 text-base font-bold">{p.text}</td>
                    <td className="py-1 pr-2 text-[var(--muted)]">{cmText(p.widthMm)} × {cmText(p.heightMm)} см</td>
                    <td className="py-1 pr-2 text-right text-[var(--muted)]">{p.count > 1 ? `${p.count} шт. × ${formatUAH(p.price)}` : ""}</td>
                    <td className="py-1 text-right font-bold">{formatUAH(p.price * p.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {piecePrices.length > 0 && <p className="m-0 text-[12px] text-[var(--muted)]">{t.piecePricesNote(formatUAH(CFG.minPrice))}</p>}
        </BuyPanel>
      </form>
    </div>
  );
}
