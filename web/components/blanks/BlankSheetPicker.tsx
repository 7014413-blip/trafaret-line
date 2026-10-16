"use client";

// Material, thickness and colour steps. Changing the material or thickness keeps the colour
// when that sheet has it and takes the first colour otherwise.

import { PlaqueChip } from "@/components/signage/PlaqueChip";
import { FIELDSET_CLASS, LEGEND_CLASS } from "@/components/ui/form-classes";
import {
  BLANK_COLOURS, BLANK_GROUPS, blankSheetAt, blankSheetInGroup, blankSheetsAt, blankThicknessLabel, blankThicknesses,
} from "@/lib/blanks/sheets";
import { MATERIALS } from "@/lib/materials";
import type { BlankSheetOption } from "@/types/blank";

export function BlankSheetPicker({ value, onChange }: { value: BlankSheetOption; onChange: (sheet: BlankSheetOption) => void }) {
  const group = BLANK_GROUPS.find((g) => g.id === value.group) ?? BLANK_GROUPS[0];
  const mm = MATERIALS[value.materialId].thicknessMm;
  const colours = blankSheetsAt(value.group, mm).map((s) => BLANK_COLOURS[s.colourId]);

  return (
    <>
      <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>Матеріал</legend>
        <div className="flex flex-wrap gap-2">
          {BLANK_GROUPS.map((g) => <PlaqueChip key={g.id} id={`bl-group-${g.id}`} on={g.id === value.group} onClick={() => g.id !== value.group && onChange(blankSheetInGroup(g.id, value))}>{g.name.uk}</PlaqueChip>)}
        </div>
        <span className="text-[13px] text-[var(--muted)]">{group.note.uk}</span>
      </fieldset>

      <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>Товщина</legend>
        <div className="flex flex-wrap gap-2">
          {blankThicknesses(value.group).map((t) => (
            <PlaqueChip key={t} id={`bl-thickness-${String(t).replace(".", "-")}`} on={t === mm} onClick={() => onChange(blankSheetAt(value.group, t, value.colourId))}>{blankThicknessLabel(value.group, t)}</PlaqueChip>
          ))}
        </div>
      </fieldset>

      <fieldset className={FIELDSET_CLASS}><legend className={LEGEND_CLASS}>Колір</legend>
        <div role="radiogroup" aria-label="Колір" className="flex flex-wrap gap-2.5">
          {colours.map((c) => {
            const on = c.id === value.colourId;
            return (
              <button key={c.id} id={`bl-colour-${c.id}`} type="button" role="radio" aria-checked={on} title={c.name.uk} onClick={() => onChange(blankSheetAt(value.group, mm, c.id))}
                className={`h-10 w-10 rounded-full border-2 ${on ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`}
                style={{ background: c.shine ? `linear-gradient(135deg, ${c.hex}, ${c.shine} 45%, ${c.hex} 60%, ${c.shine})` : c.hex }}>
                <span className="sr-only">{c.name.uk}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[13px] text-[var(--muted)]">{colours.find((c) => c.id === value.colourId)?.name.uk}</span>
      </fieldset>
    </>
  );
}
