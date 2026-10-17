"use client";

// Size of a plaque constructor: fixed sizes with their prices and «Свій розмір» with width and
// height fields. The typed size is clamped by the constructor (usePresetSize); leaving a field
// shows the size that will be made.

import { FIELDSET_CLASS, INPUT_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { cmText, formatUAH } from "@/lib/format";
import type { PresetSizeState, SizeLimits, SizePresetOption } from "@/types/constructor-ui";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { tr } from "@/lib/i18n/translate";

export function SizePresetPicker<P extends SizePresetOption>({ idPrefix, presets, priceOf, state, limits, columns = 4, customPrice, note }: {
  idPrefix: string;
  presets: P[];
  priceOf: (preset: P) => number;
  state: PresetSizeState;
  limits: SizeLimits;
  columns?: 3 | 4;
  /** Price shown on «Свій розмір» while it is chosen; «ціна одразу» otherwise. */
  customPrice?: number;
  /** Rules of the custom size under the fields. */
  note: React.ReactNode;
}) {
  const t = tr(SIGNAGE, useLocale());
  const { sizeCode, setSizeCode, customCm, setCustomCm, size } = state;
  const card = (on: boolean) => `grid min-h-14 gap-0.5 rounded-xl border-[1.5px] px-2 py-1.5 tabular-nums ${on ? "border-[2px] border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`;
  const showClamped = () => setCustomCm({ w: size.widthMm / 10, h: size.heightMm / 10 });
  const custom = sizeCode === "custom";

  return (
    <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.size}</legend>
      <div className={`grid grid-cols-2 gap-2 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        {presets.map((p) => (
          <button key={p.code} id={`${idPrefix}-size-${p.code}`} type="button" aria-pressed={sizeCode === p.code} onClick={() => setSizeCode(p.code)} className={card(sizeCode === p.code)}>
            <b className="text-[15px]">{cmText(p.widthMm)}×{cmText(p.heightMm)} см</b>
            <span className="text-[13px] text-[var(--muted)]">{formatUAH(priceOf(p))}</span>
          </button>
        ))}
        <button id={`${idPrefix}-size-custom`} type="button" aria-pressed={custom} onClick={() => setSizeCode("custom")} className={card(custom)}>
          <b className="text-[15px]">{t.ownSize}</b>
          <span className="text-[13px] text-[var(--muted)]">{custom && customPrice != null ? formatUAH(customPrice) : t.priceAtOnce}</span>
        </button>
      </div>
      {custom && (
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-sm text-[var(--muted)]">{t.widthCm}
            <input id={`${idPrefix}-w`} type="number" inputMode="decimal" step={0.5} min={limits.minWidthMm / 10} max={limits.maxWidthMm / 10} value={customCm.w}
              onChange={(e) => setCustomCm((c) => ({ ...c, w: Number(e.target.value) || 0 }))} onBlur={showClamped} className={INPUT_CLASS} />
          </label>
          <label className="grid gap-1 text-sm text-[var(--muted)]">{t.heightCm}
            <input id={`${idPrefix}-h`} type="number" inputMode="decimal" step={0.5} min={limits.minHeightMm / 10} max={limits.maxHeightMm / 10} value={customCm.h}
              onChange={(e) => setCustomCm((c) => ({ ...c, h: Number(e.target.value) || 0 }))} onBlur={showClamped} className={INPUT_CLASS} />
          </label>
          <span className="col-span-2 text-[13px] text-[var(--muted)]">{note}</span>
        </div>
      )}
    </fieldset>
  );
}
