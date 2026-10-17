"use client";

// Letter height of a constructor: chips with the usual heights and a field for the customer's
// own height in cm. Every value is clamped to the constructor's limits; while the customer types,
// the field keeps their text and the design follows each valid number.

import { useState } from "react";
import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { FIELDSET_CLASS, INPUT_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { tr } from "@/lib/i18n/translate";
import { decimal, units } from "@/lib/i18n/dictionaries/units";

export function LetterHeightField({ legend, idPrefix, heightsCm, valueMm, minMm, maxMm, onChange, inputLabel, note, extra }: {
  legend?: string;
  idPrefix: string;
  heightsCm: number[];
  valueMm: number;
  minMm: number;
  maxMm: number;
  onChange: (mm: number) => void;
  inputLabel?: string;
  /** Hint under the field. */
  note?: React.ReactNode;
  /** A second control next to the field (fit to a length). */
  extra?: React.ReactNode;
}) {
  const locale = useLocale();
  const t = tr(SIGNAGE, locale);
  const [typed, setTyped] = useState<string | null>(null);
  const clamp = (mm: number) => Math.min(maxMm, Math.max(minMm, Math.round(mm)));

  const field = (
    <label className="grid gap-1 text-sm text-[var(--muted)]">{inputLabel ?? t.ownHeightCm}
      <input id={`${idPrefix}-height`} type="number" inputMode="decimal" step={0.5} min={minMm / 10} max={maxMm / 10}
        value={typed ?? String(valueMm / 10)}
        onChange={(e) => { setTyped(e.target.value); const cm = Number(e.target.value.replace(",", ".")); if (cm > 0) onChange(clamp(cm * 10)); }}
        onBlur={() => setTyped(null)} className={`${INPUT_CLASS} w-full min-w-0`} />
    </label>
  );

  return (
    <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{legend ?? t.letterHeight}</legend>
      <div className="flex flex-wrap gap-2">
        {heightsCm.map((cm) => <PlaqueChip key={cm} id={`${idPrefix}-h-${cm}`} on={valueMm === cm * 10} onClick={() => onChange(clamp(cm * 10))}>{decimal(cm, locale)} {units(locale).cm}</PlaqueChip>)}
      </div>
      {extra ? <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">{field}{extra}</div> : field}
      {note && <span className="text-[13px] text-[var(--muted)]">{note}</span>}
    </fieldset>
  );
}
