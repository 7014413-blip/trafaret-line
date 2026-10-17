"use client";

// «Написи на планці» constructor (Денис 2026-10-10): words cut from one layer of acrylic, the
// letters of each word standing on a thin strip, so a word is one piece (a coffee shop menu on
// his photos). The customer types the lines and a price or number for each (its own piece),
// picks the font of every line (shop fonts and their own), capitals or not, the colour and
// the letter height, or the length of the widest row. Preview and price change at once.
// Layout: lib/joined-words/layout.ts, price: lib/joined-words/price.ts (repeated on the server).

import { useMemo, useState } from "react";
import { BuyPanel } from "@/components/signage/BuyPanel";
import { ConstructorHeader } from "@/components/signage/ConstructorHeader";
import { DesignChecks } from "@/components/signage/DesignChecks";
import { JoinedWordsPreview } from "@/components/signage/JoinedWordsPreview";
import { LetterHeightField } from "@/components/signage/LetterHeightField";
import { PlaqueLinesEditor } from "@/components/signage/PlaqueLinesEditor";
import { QuantityField } from "@/components/signage/QuantityField";
import { SheetSwatches } from "@/components/signage/SheetSwatches";
import { FIELDSET_CLASS, INPUT_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { useBuyState } from "@/lib/client/use-buy-state";
import { useDispatchLabel } from "@/lib/client/use-dispatch-label";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { joinedWordsThumbnailSvg } from "@/lib/export/joined-words-thumbnail";
import { cmText } from "@/lib/format";
import { checkJoinedWords } from "@/lib/joined-words/check";
import { DEFAULT_JOINED_WORDS_CONFIG } from "@/lib/joined-words/config";
import { findJoinedWordsMaterial } from "@/lib/joined-words/find-material";
import { letterHeightForWidth } from "@/lib/joined-words/fit-length";
import { computeJoinedWordsLayout } from "@/lib/joined-words/layout";
import { JOINED_WORDS_MATERIALS } from "@/lib/joined-words/materials";
import { measureJoinedWordsDesign } from "@/lib/joined-words/measure-design";
import { priceJoinedWords } from "@/lib/joined-words/price";
import { useCart } from "@/store/cart-store";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { SIGNAGE_LETTERS } from "@/lib/i18n/dictionaries/signage-letters";
import { tr } from "@/lib/i18n/translate";
import type { JoinedLineMeasures, JoinedWordsDesign } from "@/types/joined-words";
import type { PlaqueTextLine } from "@/types/plaques";

const CFG = DEFAULT_JOINED_WORDS_CONFIG;
// Example lines of a coffee shop menu: the text comes from the dictionary in the page language.
const FIRST_FONTS: Omit<PlaqueTextLine, "text">[] = [
  { fontId: "oswald", size: 1 },
  { fontId: "oswald", size: 1 },
  { fontId: "oswald", size: 1 },
  { fontId: "oswald", size: 1 },
];
const FIRST_TAILS = ["110/160", "110/160", "100", "110"];
const HEIGHTS_CM = [3, 4, 5, 6, 8, 10];


export function JoinedWordsConstructor() {
  const locale = useLocale();
  const t = tr(SIGNAGE_LETTERS, locale).joinedWords;
  const ts = tr(SIGNAGE, locale);
  const text = usePlaqueLines(FIRST_FONTS.map((f, i) => ({ ...f, text: t.firstLines[i] })), CFG.maxLines);
  const [tails, setTails] = useState<string[]>(FIRST_TAILS);
  const [upper, setUpper] = useState(true);
  const [materialId, setMaterialId] = useState("black");
  const [letterMm, setLetterMm] = useState(50);
  const [widthInput, setWidthInput] = useState("");
  const [qty, setQty] = useState(1);
  const buyState = useBuyState();
  const dispatch = useDispatchLabel(locale);
  const cart = useCart();

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
  const price = priceJoinedWords(design, layout, CFG, undefined, locale);
  const canBuy = ready && errors.length === 0;

  const setHeight = (mm: number) => setLetterMm(Math.min(CFG.maxLetterMm, Math.max(CFG.minLetterMm, Math.round(mm))));
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
      title: t.cartTitle(words.length > 60 ? `${words.slice(0, 59)}…` : words, cmText(letterMm), sheet.name[locale].toLowerCase()),
      materialId: "acrylic",
      widthCm: Math.round(layout.widthMm) / 10,
      heightCm: Math.round(layout.heightMm) / 10,
      quantity: qty,
      kind: "words",
      words: final,
      basePrice: price.internal.basePrice,
      vectorSvg: joinedWordsThumbnailSvg(layout, paths, sheet.hex),
    });
    buyState.added();
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label={t.previewRegion} className="self-start overflow-hidden rounded-2xl border border-[var(--line)] lg:sticky lg:top-24">
        <JoinedWordsPreview layout={layout} paths={paths} sheet={sheet} label={t.previewLabel(cmText(layout.widthMm), cmText(layout.heightMm))} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{ts.wholeSet(cmText(layout.widthMm), cmText(layout.heightMm))} · {layout.pieces.length} {ts.piecesShort}</span>
          <span>{ts.sheetThickness(sheet.name[locale], sheet.thicknessMm)}</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <ConstructorHeader kicker={t.kicker} title={t.title} lead={t.lead} />

        <PlaqueLinesEditor state={text} legend={t.linesLegend} idPrefix="jw" maxChars={CFG.maxLineChars}
          capByLine={new Map(layout.pieces.map((p) => [p.lineIndex, p.capMm]))}
          onRemove={(i) => setTails((list) => list.filter((_, k) => k !== i))}
          renderExtra={(i) => (
            <label className="grid gap-1 text-sm text-[var(--muted)]">{t.tailLabel}
              <input id={`jw-tail-${i}`} value={tails[i] ?? ""} maxLength={CFG.maxTailChars} placeholder={t.tailPlaceholder}
                onChange={(e) => setTails((list) => { const next = [...list]; while (next.length <= i) next.push(""); next[i] = e.target.value; return next; })}
                className={`${INPUT_CLASS} w-full min-w-0`} />
            </label>
          )} />

        <label className="flex items-center gap-2 text-sm">
          <input id="jw-upper" type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="h-5 w-5 accent-[var(--ink)]" />
          {t.upperOnly}
        </label>

        <LetterHeightField idPrefix="jw" heightsCm={HEIGHTS_CM} valueMm={letterMm} minMm={CFG.minLetterMm} maxMm={CFG.maxLetterMm} onChange={setLetterMm}
          inputLabel={t.capHeightInput}
          note={t.heightNote(cmText(CFG.minLetterMm), cmText(CFG.maxLetterMm))}
          extra={(
            <label className="grid gap-1 text-sm text-[var(--muted)]">{t.widestRow}
              <span className="flex min-w-0 gap-2">
                <input id="jw-width" type="number" inputMode="decimal" step={1} min={5} value={widthInput} placeholder={cmText(layout.widthMm)}
                  onChange={(e) => setWidthInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fitWidth(); } }}
                  className={`${INPUT_CLASS} w-full min-w-0`} />
                <button id="jw-fit" type="button" onClick={fitWidth} disabled={!widthInput || !ready} className="h-11 shrink-0 rounded-xl border-[1.5px] border-[var(--ink)] px-3 text-sm font-semibold disabled:opacity-40">{t.fit}</button>
              </span>
            </label>
          )} />

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{ts.acrylicColour}</legend>
          <SheetSwatches sheets={JOINED_WORDS_MATERIALS} value={materialId} onChange={setMaterialId} idPrefix="jw-c" label={ts.acrylicColour} />
          <span className="text-[13px] text-[var(--muted)]">{t.colourNote(ts.sheetThickness(sheet.name[locale], sheet.thicknessMm), sheet.inStock ? "" : ts.toOrder)}</span>
        </fieldset>

        <QuantityField legend={ts.setsQuantity} idPrefix="jw" value={qty} onChange={setQty} sets />

        <DesignChecks checks={checks} />

        <BuyPanel lines={price.lines.map((label) => ({ label }))} total={price.total} unitPrice={price.unitPrice} qty={qty} unitLabel={ts.setsShort} note={dispatch}
          state={buyState.state} canBuy={canBuy} onBuy={buy} />
      </form>
    </div>
  );
}
