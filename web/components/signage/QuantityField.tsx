"use client";

// Quantity of a constructor design with the wholesale scale and how many more pieces give the
// next discount (lib/calculators/pricing.ts nextTierHint).

import { FIELDSET_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { nextTierHint } from "@/lib/calculators/pricing";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CONSTRUCTOR } from "@/lib/i18n/dictionaries/constructor";
import { tr } from "@/lib/i18n/translate";

const MAX_QTY = 9999;
const clampQty = (value: number) => Math.max(1, Math.min(MAX_QTY, Math.round(value) || 1));

export function QuantityField({ legend, idPrefix, value, onChange, sets = false, tierQuantity }: {
  legend?: string;
  idPrefix: string;
  value: number;
  onChange: (qty: number) => void;
  /** The design is a set (letters, words): the scale speaks of sets. */
  sets?: boolean;
  /** Pieces the discount counts (a series of plaques counts every plaque); the quantity by default. */
  tierQuantity?: number;
}) {
  const t = tr(CONSTRUCTOR, useLocale());
  const hint = nextTierHint(tierQuantity ?? value);
  const scale = sets ? t.scaleSets : t.scalePieces;
  return (
    <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{legend ?? t.quantity}</legend>
      <div className="flex items-center gap-1.5">
        <button type="button" aria-label={t.less} onClick={() => onChange(clampQty(value - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
        <input id={`${idPrefix}-qty`} type="number" min={1} max={MAX_QTY} value={value} onChange={(e) => onChange(clampQty(Number(e.target.value)))} aria-label={t.quantity}
          className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
        <button type="button" aria-label={t.more} onClick={() => onChange(clampQty(value + 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
      </div>
      <span className="text-[13px] text-[var(--muted)]">{scale}{hint ? t.addForDiscount(hint.addQty, Math.round(hint.nextDiscount * 100)) : ""}</span>
    </fieldset>
  );
}
