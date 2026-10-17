"use client";

// Size of a blank: chips of the popular sizes with the price of one piece and «Свій розмір»
// with one field (diameter or the larger side) or width and height for a rectangle. A typed
// size is shown as it will be cut when the field is left.

import { FIELDSET_CLASS, INPUT_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { BLANK_SIZE_LIMITS_MM, clampBlankSideMm, presetMm } from "@/lib/blanks/size";
import { blankShapeSizeText } from "@/lib/blanks/shape-size-text";
import { cmText, formatUAH } from "@/lib/format";
import type { BlankShape, BlankSizeValue } from "@/types/blank";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { BLANKS } from "@/lib/i18n/dictionaries/blanks";
import { tr } from "@/lib/i18n/translate";

export function BlankSizePicker({ shape, value, onChange, priceOf }: {
  shape: BlankShape;
  value: BlankSizeValue;
  onChange: (value: BlankSizeValue) => void;
  /** Price of one piece of this size in the chosen sheet. */
  priceOf: (widthMm: number, heightMm: number) => number;
}) {
  const locale = useLocale();
  const t = tr(BLANKS, locale);
  const card = (on: boolean) => `grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 tabular-nums ${on ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`;
  const custom = value.preset == null;
  const box = shape.sizeMode === "box";
  const setSide = (key: "widthMm" | "heightMm", cm: number) => {
    const mm = Math.round((Number.isFinite(cm) ? cm : 0) * 10);
    onChange(box ? { ...value, preset: null, [key]: mm } : { preset: null, widthMm: mm, heightMm: mm });
  };
  const showCut = () => onChange({ ...value, widthMm: clampBlankSideMm(value.widthMm), heightMm: clampBlankSideMm(box ? value.heightMm : value.widthMm) });
  const firstLabel = shape.sizeMode === "diameter" ? t.diameterCm : box ? t.widthCm : t.longerSideCm;

  return (
    <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.size}</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {shape.presetsCm.map((p, i) => {
          const size = presetMm(p);
          return (
            <button key={i} id={`bl-size-${i}`} type="button" aria-pressed={value.preset === i} onClick={() => onChange({ preset: i, ...size })} className={card(value.preset === i)}>
              <b className="text-[15px]">{blankShapeSizeText(shape, size.widthMm, size.heightMm, locale)}</b>
              <span className="text-[13px] text-[var(--muted)]">{formatUAH(priceOf(size.widthMm, size.heightMm), locale)}</span>
            </button>
          );
        })}
        <button id="bl-size-custom" type="button" aria-pressed={custom} onClick={() => onChange({ ...value, preset: null })} className={card(custom)}>
          <b className="text-[15px]">{t.ownSize}</b>
          <span className="text-[13px] text-[var(--muted)]">{custom ? formatUAH(priceOf(clampBlankSideMm(value.widthMm), clampBlankSideMm(box ? value.heightMm : value.widthMm)), locale) : t.priceAtOnce}</span>
        </button>
      </div>
      {custom && (
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-sm text-[var(--muted)]">{firstLabel}
            <input id="bl-w" type="number" inputMode="decimal" step={0.5} min={BLANK_SIZE_LIMITS_MM.min / 10} max={BLANK_SIZE_LIMITS_MM.max / 10}
              value={value.widthMm / 10} onChange={(e) => setSide("widthMm", Number(e.target.value))} onBlur={showCut} className={INPUT_CLASS} />
          </label>
          {box && (
            <label className="grid gap-1 text-sm text-[var(--muted)]">{t.heightCm}
              <input id="bl-h" type="number" inputMode="decimal" step={0.5} min={BLANK_SIZE_LIMITS_MM.min / 10} max={BLANK_SIZE_LIMITS_MM.max / 10}
                value={value.heightMm / 10} onChange={(e) => setSide("heightMm", Number(e.target.value))} onBlur={showCut} className={INPUT_CLASS} />
            </label>
          )}
          <span className="col-span-2 text-[13px] text-[var(--muted)]">
            {t.sizeRange(cmText(BLANK_SIZE_LIMITS_MM.min, locale), cmText(BLANK_SIZE_LIMITS_MM.max, locale))}
            {shape.sizeMode === "side" ? t.sizeBySide : ""}
          </span>
        </div>
      )}
    </fieldset>
  );
}
