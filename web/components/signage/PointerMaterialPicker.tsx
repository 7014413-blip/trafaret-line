"use client";

// Material and colour of one pointer sign layer: a group (acrylic, mirror acrylic,
// polystyrene), then the colour swatches of that group. No prices here: every sheet is included.

import { SheetSwatches } from "@/components/signage/SheetSwatches";
import { FIELDSET_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import { POINTER_MATERIAL_GROUPS, POINTER_MATERIALS } from "@/lib/pointer-sign/materials";
import { findPointerMaterial } from "@/lib/pointer-sign/find-material";
import type { PointerMaterial } from "@/types/pointer-sign";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { tr } from "@/lib/i18n/translate";

export function PointerMaterialPicker({ legend, value, onChange, idPrefix, materials = POINTER_MATERIALS }: {
  legend: string;
  value: string;
  onChange: (id: string) => void;
  idPrefix: string;
  /** Sheets to choose from (the two-layer plaques add light bases). */
  materials?: PointerMaterial[];
}) {
  const locale = useLocale();
  const t = tr(SIGNAGE, locale);
  const current = findPointerMaterial(value, materials);
  const sheets = materials.filter((m) => m.group === current.group);
  const pickGroup = (group: PointerMaterial["group"]) => {
    if (group === current.group) return;
    const first = materials.find((m) => m.group === group && m.inStock) ?? materials.find((m) => m.group === group);
    if (first) onChange(first.id);
  };

  return (
    <fieldset className={FIELDSET_CLASS}>
      <legend className={LEGEND_CLASS}>{legend}</legend>
      <div role="radiogroup" aria-label={t.materialOf(legend)} className="flex flex-wrap gap-2">
        {POINTER_MATERIAL_GROUPS.filter((g) => materials.some((m) => m.group === g.id)).map((g) => (
          <button key={g.id} id={`${idPrefix}-g-${g.id}`} type="button" role="radio" aria-checked={current.group === g.id} onClick={() => pickGroup(g.id)}
            className={`h-10 rounded-full border-[1.5px] px-3.5 text-sm ${current.group === g.id ? "border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)]"}`}>
            {t.pointerGroups[g.id]}
          </button>
        ))}
      </div>
      <SheetSwatches sheets={sheets} value={value} onChange={onChange} idPrefix={`${idPrefix}-c`} label={t.colourOf(legend)} />
      <span className="text-[13px] text-[var(--muted)]">{current.name[locale]}{current.inStock ? "" : t.toOrder}</span>
    </fieldset>
  );
}
