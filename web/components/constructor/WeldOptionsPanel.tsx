"use client";

// Options of the welded mode: bar under the line, outline, skewers, letter density.

import type { WeldOptions } from "@/types/geometry";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CONSTRUCTOR } from "@/lib/i18n/dictionaries/constructor";
import { tr } from "@/lib/i18n/translate";

const chip = (on: boolean) => `rounded-full border-[1.5px] px-3 py-1.5 text-sm ${on ? "border-[var(--ink)] font-bold" : "border-[var(--line)]"}`;

/** Overlap of neighbouring letters, from «touch lightly» to «very dense». */
const DENSITY = [0.02, 0.04, 0.08] as const;

export function WeldOptionsPanel({ value, onChange }: { value: WeldOptions; onChange: (next: WeldOptions) => void }) {
  const t = tr(CONSTRUCTOR, useLocale());
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.joining}</legend>
      <div className="flex flex-wrap gap-2">
        {DENSITY.map((share, i) => (
          <button key={share} type="button" aria-pressed={value.overlapShare === share} className={chip(value.overlapShare === share)}
            onClick={() => onChange({ ...value, overlapShare: share })}>{t.density[i]}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={value.baseline.enabled} className={chip(value.baseline.enabled)}
          onClick={() => onChange({ ...value, baseline: { ...value.baseline, enabled: !value.baseline.enabled } })}>{t.baseline}</button>
        <button type="button" aria-pressed={value.outline.enabled} className={chip(value.outline.enabled)}
          onClick={() => onChange({ ...value, outline: { ...value.outline, enabled: !value.outline.enabled } })}>{t.outline}</button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[var(--muted)]">{t.skewers}</span>
        {([0, 1, 2] as const).map((n) => (
          <button key={n} type="button" aria-pressed={value.skewers.count === n} className={chip(value.skewers.count === n)}
            onClick={() => onChange({ ...value, skewers: { ...value.skewers, count: n } })}>{t.skewerCounts[n]}</button>
        ))}
      </div>
      {value.skewers.count > 0 && (
        <label className="grid gap-1 text-sm text-[var(--muted)]">{t.skewerLength}
          <input id="k-skewer" type="number" min={4} max={20} value={Math.round(value.skewers.lengthMm / 10)}
            onChange={(e) => onChange({ ...value, skewers: { ...value.skewers, lengthMm: Math.max(40, Math.min(200, Number(e.target.value) * 10)) } })}
            className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base text-[var(--ink)]" />
        </label>
      )}
      <p className="m-0 text-[13px] text-[var(--muted)]">{t.weldNote}</p>
    </fieldset>
  );
}
