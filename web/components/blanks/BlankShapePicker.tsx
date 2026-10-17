"use client";

// Shape step: a tile per shape with its outline.

import { FIELDSET_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { BLANK_SHAPES } from "@/lib/blanks/shapes";
import { blankShapePath, drawnSize } from "@/lib/blanks/shape-path";
import type { BlankShapeId } from "@/types/blank";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { BLANKS } from "@/lib/i18n/dictionaries/blanks";
import { tr } from "@/lib/i18n/translate";

export function BlankShapePicker({ value, onChange }: { value: BlankShapeId; onChange: (id: BlankShapeId) => void }) {
  const locale = useLocale();
  const t = tr(BLANKS, locale);
  return (
    <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>{t.shape}</legend>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {BLANK_SHAPES.map((shape) => {
          const box = shape.sizeMode === "box" ? { w: 24, h: 36 } : drawnSize(shape.aspect, 36, 36, shape.sizeMode);
          const on = value === shape.id;
          return (
            <button key={shape.id} id={`bl-shape-${shape.id}`} type="button" aria-pressed={on} onClick={() => onChange(shape.id)} title={shape.name[locale]}
              className={`grid justify-items-center gap-1 rounded-xl border-[1.5px] px-1 py-2 text-[12px] leading-tight ${on ? "border-[2px] border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)]"}`}>
              <svg viewBox="0 0 40 40" aria-hidden="true" className="h-9 w-9">
                <path d={blankShapePath(shape.id, box.w, box.h)} transform={`translate(${(40 - box.w) / 2} ${(40 - box.h) / 2})`} fill="#e2e8f0" stroke="#0f172a" strokeWidth={1.2} />
              </svg>
              <span className="line-clamp-2 text-center">{shape.name[locale]}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
