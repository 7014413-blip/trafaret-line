"use client";

// Options of the welded mode: bar under the line, outline, skewers, letter density.

import type { WeldOptions } from "@/types/geometry";

const chip = (on: boolean) => `rounded-full border-[1.5px] px-3 py-1.5 text-sm ${on ? "border-[var(--ink)] font-bold" : "border-[var(--line)]"}`;

const DENSITY: { label: string; share: number }[] = [
  { label: "Легко торкаються", share: 0.02 },
  { label: "Щільно", share: 0.04 },
  { label: "Дуже щільно", share: 0.08 },
];

export function WeldOptionsPanel({ value, onChange }: { value: WeldOptions; onChange: (next: WeldOptions) => void }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">З’єднання літер</legend>
      <div className="flex flex-wrap gap-2">
        {DENSITY.map((d) => (
          <button key={d.share} type="button" aria-pressed={value.overlapShare === d.share} className={chip(value.overlapShare === d.share)}
            onClick={() => onChange({ ...value, overlapShare: d.share })}>{d.label}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={value.baseline.enabled} className={chip(value.baseline.enabled)}
          onClick={() => onChange({ ...value, baseline: { ...value.baseline, enabled: !value.baseline.enabled } })}>Планка під словом</button>
        <button type="button" aria-pressed={value.outline.enabled} className={chip(value.outline.enabled)}
          onClick={() => onChange({ ...value, outline: { ...value.outline, enabled: !value.outline.enabled } })}>Обведення навколо</button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[var(--muted)]">Шпажки:</span>
        {([0, 1, 2] as const).map((n) => (
          <button key={n} type="button" aria-pressed={value.skewers.count === n} className={chip(value.skewers.count === n)}
            onClick={() => onChange({ ...value, skewers: { ...value.skewers, count: n } })}>{n === 0 ? "без шпажок" : n === 1 ? "одна" : "дві"}</button>
        ))}
      </div>
      {value.skewers.count > 0 && (
        <label className="grid gap-1 text-sm text-[var(--muted)]">Довжина шпажки, см
          <input id="k-skewer" type="number" min={4} max={20} value={Math.round(value.skewers.lengthMm / 10)}
            onChange={(e) => onChange({ ...value, skewers: { ...value.skewers, lengthMm: Math.max(40, Math.min(200, Number(e.target.value) * 10)) } })}
            className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base text-[var(--ink)]" />
        </label>
      )}
      <p className="m-0 text-[13px] text-[var(--muted)]">Крапки над «і», «ї», «й» і окремі слова з’єднуємо перемичками автоматично, виріб виходить однією деталлю.</p>
    </fieldset>
  );
}
