"use client";

// Quantity of a constructor design with the wholesale scale and how many more pieces give the
// next discount (lib/calculators/pricing.ts nextTierHint).

import { FIELDSET_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { nextTierHint } from "@/lib/calculators/pricing";

const MAX_QTY = 9999;
const clampQty = (value: number) => Math.max(1, Math.min(MAX_QTY, Math.round(value) || 1));

export function QuantityField({ legend = "Кількість", idPrefix, value, onChange, sets = false, tierQuantity }: {
  legend?: string;
  idPrefix: string;
  value: number;
  onChange: (qty: number) => void;
  /** The design is a set (letters, words): the scale speaks of sets. */
  sets?: boolean;
  /** Pieces the discount counts (a series of plaques counts every plaque); the quantity by default. */
  tierQuantity?: number;
}) {
  const hint = nextTierHint(tierQuantity ?? value);
  const scale = sets ? "Від 10 наборів −5%, від 50 −10%, від 100 −15%." : "Від 10 шт −5%, від 50 шт −10%, від 100 шт −15%.";
  return (
    <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{legend}</legend>
      <div className="flex items-center gap-1.5">
        <button type="button" aria-label="Менше" onClick={() => onChange(clampQty(value - 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">−</button>
        <input id={`${idPrefix}-qty`} type="number" min={1} max={MAX_QTY} value={value} onChange={(e) => onChange(clampQty(Number(e.target.value)))} aria-label="Кількість"
          className="h-10 w-16 rounded-lg border border-[var(--line)] bg-[var(--card)] text-center" />
        <button type="button" aria-label="Більше" onClick={() => onChange(clampQty(value + 1))} className="h-10 w-10 rounded-lg border border-[var(--line)] text-lg">+</button>
      </div>
      <span className="text-[13px] text-[var(--muted)]">{scale}{hint ? ` Додайте ще ${hint.addQty} шт., щоб отримати −${Math.round(hint.nextDiscount * 100)}%.` : ""}</span>
    </fieldset>
  );
}
