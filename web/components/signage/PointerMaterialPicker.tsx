"use client";

// Material and colour of one pointer sign layer: a group (acrylic, mirror acrylic,
// polystyrene), then the colour swatches of that group. No prices here: every sheet is included.

import { POINTER_MATERIAL_GROUPS, POINTER_MATERIALS } from "@/lib/pointer-sign/materials";
import { findPointerMaterial } from "@/lib/pointer-sign/find-material";
import type { PointerMaterial } from "@/types/pointer-sign";

const swatchBackground = (sheet: PointerMaterial) =>
  sheet.mirror ? `linear-gradient(135deg, #f8fafc, ${sheet.hex} 45%, #f8fafc 60%, ${sheet.hex})` : sheet.hex;

export function PointerMaterialPicker({ legend, value, onChange, idPrefix }: {
  legend: string;
  value: string;
  onChange: (id: string) => void;
  idPrefix: string;
}) {
  const current = findPointerMaterial(value);
  const sheets = POINTER_MATERIALS.filter((m) => m.group === current.group);
  const pickGroup = (group: PointerMaterial["group"]) => {
    if (group === current.group) return;
    const first = POINTER_MATERIALS.find((m) => m.group === group && m.inStock) ?? POINTER_MATERIALS.find((m) => m.group === group);
    if (first) onChange(first.id);
  };

  return (
    <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
      <legend className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">{legend}</legend>
      <div role="radiogroup" aria-label={`${legend}: матеріал`} className="flex flex-wrap gap-2">
        {POINTER_MATERIAL_GROUPS.map((g) => (
          <button key={g.id} id={`${idPrefix}-g-${g.id}`} type="button" role="radio" aria-checked={current.group === g.id} onClick={() => pickGroup(g.id)}
            className={`h-10 rounded-full border-[1.5px] px-3.5 text-sm ${current.group === g.id ? "border-[var(--ink)] bg-[var(--surface)] font-bold" : "border-[var(--line)] bg-[var(--card)]"}`}>
            {g.name}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label={`${legend}: колір`} className="flex flex-wrap gap-2.5">
        {sheets.map((sheet) => (
          <button key={sheet.id} id={`${idPrefix}-c-${sheet.id}`} type="button" role="radio" aria-checked={value === sheet.id} title={sheet.name.uk} onClick={() => onChange(sheet.id)}
            className={`relative h-10 w-10 rounded-full border-2 ${value === sheet.id ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`}
            style={{ background: swatchBackground(sheet) }}>
            {!sheet.inStock && <span className="absolute -right-1 -bottom-1 rounded-full bg-[var(--card)] px-1 text-[9px] text-[var(--muted)]">зам.</span>}
            <span className="sr-only">{sheet.name.uk}</span>
          </button>
        ))}
      </div>
      <span className="text-[13px] text-[var(--muted)]">{current.name.uk}{current.inStock ? "" : " · під замовлення"}</span>
    </fieldset>
  );
}
