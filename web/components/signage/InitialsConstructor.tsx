"use client";

// Wedding initials constructor (Денис 2026-10-10): two letters and a separator («S | D») cut from
// mirror acrylic, laid on the cake as separate pieces or joined on a strip with a skewer.
// The customer types the letters, picks the separator, the font (a Times-like serif by default,
// any shop font or their own), the letter height and the colour; preview and price at once.
// Layout: lib/initials/layout.ts, price: lib/initials/price.ts (repeated on the server).

import { useEffect, useMemo, useState } from "react";
import { CustomFontPanel } from "@/components/constructor/CustomFontPanel";
import { FontOptions } from "@/components/constructor/FontOptions";
import { BuyPanel } from "@/components/signage/BuyPanel";
import { ConstructorHeader } from "@/components/signage/ConstructorHeader";
import { DesignChecks } from "@/components/signage/DesignChecks";
import { InitialsPreview } from "@/components/signage/InitialsPreview";
import { LetterHeightField } from "@/components/signage/LetterHeightField";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { QuantityField } from "@/components/signage/QuantityField";
import { SheetSwatches } from "@/components/signage/SheetSwatches";
import { FIELDSET_CLASS, INPUT_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { useBuyState } from "@/lib/client/use-buy-state";
import { useDispatchLabel } from "@/lib/client/use-dispatch-label";
import { usePlaqueLines } from "@/lib/client/use-plaque-lines";
import { initialsThumbnailSvg } from "@/lib/export/initials-thumbnail";
import { checkInitials } from "@/lib/initials/check";
import { DEFAULT_INITIALS_CONFIG } from "@/lib/initials/config";
import { computeInitialsLayout } from "@/lib/initials/layout";
import { measureInitials, type MeasuredInitials } from "@/lib/initials/measure";
import { priceInitials } from "@/lib/initials/price";
import { findJoinedWordsMaterial } from "@/lib/joined-words/find-material";
import { JOINED_WORDS_MATERIALS } from "@/lib/joined-words/materials";
import { useCart } from "@/store/cart-store";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { SIGNAGE_LETTERS } from "@/lib/i18n/dictionaries/signage-letters";
import { tr } from "@/lib/i18n/translate";
import type { InitialsDesign, InitialsMode, InitialsSeparator } from "@/types/initials";
import { cmText } from "@/lib/format";

const CFG = DEFAULT_INITIALS_CONFIG;
const SEPARATORS: [InitialsSeparator, string][] = [["bar", "S | D"], ["amp", "S & D"], ["plus", "S + D"], ["dot", "S · D"], ["none", "SD"]];
// Ways to set the initials on the cake; their names are in the dictionary.
const MODES: InitialsMode[] = ["pieces", "topper"];
const HEIGHTS_CM = [5, 7, 10, 12, 15];
// Mirror sheets first: they are what wedding initials are made of.
const SHEETS = [...JOINED_WORDS_MATERIALS.filter((m) => m.mirror), ...JOINED_WORDS_MATERIALS.filter((m) => !m.mirror)];

const EMPTY: MeasuredInitials = { first: null, second: null, sep: null };

export function InitialsConstructor() {
  const locale = useLocale();
  const t = tr(SIGNAGE_LETTERS, locale).initials;
  const ts = tr(SIGNAGE, locale);
  const [first, setFirst] = useState("S");
  const [second, setSecond] = useState("D");
  const [separator, setSeparator] = useState<InitialsSeparator>("bar");
  const [mode, setMode] = useState<InitialsMode>("pieces");
  const [letterMm, setLetterMm] = useState(100);
  const [materialId, setMaterialId] = useState("mirror-gold");
  const [qty, setQty] = useState(1);
  const buyState = useBuyState();
  const dispatch = useDispatchLabel(locale);
  const fonts = usePlaqueLines([{ text: "SD", fontId: "pt-serif", size: 1 }], 1);
  const cart = useCart();
  const fontId = fonts.lines[0].fontId;
  const { setLine, fontFor } = fonts;

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
  const price = priceInitials(design, layout, CFG, undefined, locale);
  const canBuy = !!font && errors.length === 0;

  const buy = () => {
    if (!canBuy) return;
    const sep = SEPARATORS.find(([v]) => v === separator)?.[1].replace("S", design.first).replace("D", design.second) ?? `${design.first}${design.second}`;
    cart.add({
      // Same design = same cart line (quantities add up), whatever the quantity chosen here.
      key: `initials|${JSON.stringify({ ...design, quantity: 0 })}`,
      title: t.cartTitle(sep, cmText(letterMm, locale), sheet.name[locale].toLowerCase(), mode === "topper"),
      materialId: "acrylic",
      widthCm: Math.round(layout.widthMm) / 10,
      heightCm: Math.round(layout.heightMm) / 10,
      quantity: qty,
      kind: "initials",
      initials: design,
      basePrice: price.internal.basePrice,
      vectorSvg: initialsThumbnailSvg(layout, paths, sheet.hex),
    });
    buyState.added();
  };

  return (
    <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pt-4 pb-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pb-10">
      <section aria-label={t.previewRegion} className="self-start overflow-hidden rounded-2xl border border-[var(--line)] lg:sticky lg:top-24">
        <InitialsPreview layout={layout} paths={paths} sheet={sheet} label={t.previewLabel(cmText(layout.widthMm, locale), cmText(layout.heightMm, locale))} />
        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-[13px] text-[var(--muted)] tabular-nums">
          <span>{t.summary(cmText(layout.widthMm, locale), cmText(layout.heightMm, locale), cmText(letterMm, locale))}</span>
          <span>{ts.sheetThickness(sheet.name[locale], sheet.thicknessMm)}</span>
        </div>
      </section>

      <form className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5" onSubmit={(e) => e.preventDefault()}>
        <ConstructorHeader kicker={t.kicker} title={t.title} lead={t.lead} />

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.letters}</legend>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
            <label className="grid gap-1 text-sm text-[var(--muted)]">{t.first}
              <input id="in-first" value={first} maxLength={CFG.maxChars} onChange={(e) => setFirst(e.target.value)} className={`${INPUT_CLASS} h-14 w-full min-w-0 text-center text-2xl`} />
            </label>
            <label className="grid gap-1 text-sm text-[var(--muted)]">{t.second}
              <input id="in-second" value={second} maxLength={CFG.maxChars} onChange={(e) => setSecond(e.target.value)} className={`${INPUT_CLASS} h-14 w-full min-w-0 text-center text-2xl`} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {SEPARATORS.map(([v, name]) => <PlaqueChip key={v} id={`in-sep-${v}`} on={separator === v} onClick={() => setSeparator(v)}>{name}</PlaqueChip>)}
          </div>
        </fieldset>

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{ts.font}</legend>
          <select id="in-font" value={fontId} onChange={(e) => setLine(0, { fontId: e.target.value })} className={`${INPUT_CLASS} w-full min-w-0`}><FontOptions fonts={fonts.allFonts} current={fontId} /></select>
          <span className="text-[13px] text-[var(--muted)]">{t.fontNote}</span>
          <CustomFontPanel fonts={fonts.customFonts} text={`${first}${second}`}
            onAdded={(f) => { fonts.onFontAdded(f); setLine(0, { fontId: f.id }); }} onRemoved={fonts.onFontRemoved} />
        </fieldset>

        <LetterHeightField idPrefix="in" heightsCm={HEIGHTS_CM} valueMm={letterMm} minMm={CFG.minLetterMm} maxMm={CFG.maxLetterMm} onChange={setLetterMm} />

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.modeLegend}</legend>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
            {MODES.map((v) => (
              <button key={v} id={`in-mode-${v}`} type="button" aria-pressed={mode === v} onClick={() => setMode(v)}
                className={`grid gap-0.5 rounded-xl border-[1.5px] px-3 py-2 text-left ${mode === v ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                <b className="text-[15px]">{t.modes[v].name}</b><span className="text-[13px] text-[var(--muted)]">{t.modes[v].note}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{ts.colour}</legend>
          <SheetSwatches sheets={SHEETS} value={materialId} onChange={setMaterialId} idPrefix="in-c" label={ts.acrylicColour} />
          <span className="text-[13px] text-[var(--muted)]">{ts.sheetThickness(sheet.name[locale], sheet.thicknessMm)}{sheet.inStock ? "" : ts.toOrder}.</span>
        </fieldset>

        <QuantityField idPrefix="in" value={qty} onChange={setQty} />

        <DesignChecks checks={checks} />

        <BuyPanel lines={price.lines.map((label) => ({ label }))} total={price.total} unitPrice={price.unitPrice} qty={qty} note={dispatch}
          state={buyState.state} canBuy={canBuy} onBuy={buy} />
      </form>
    </div>
  );
}
