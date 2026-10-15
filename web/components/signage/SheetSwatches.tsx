"use client";

// Colour swatches of the acrylic palette (lib/calculators/signage.ts) for one layer of a sign.
// Mirror sheets get a light gradient; sheets that are made to order carry a small mark.

import type { AcrylicSheet } from "@/types/signage";

const background = (sheet: AcrylicSheet) =>
  sheet.finish === "mirror" ? `linear-gradient(135deg, #f8fafc, ${sheet.hex} 45%, #f8fafc 60%, ${sheet.hex})` : sheet.hex;

export function SheetSwatches({ sheets, value, onChange, idPrefix, label, size = "md" }: {
  sheets: AcrylicSheet[];
  value: string;
  onChange: (id: string) => void;
  idPrefix: string;
  label: string;
  size?: "md" | "sm";
}) {
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2.5">
      {sheets.map((sheet) => (
        <button key={sheet.id} id={`${idPrefix}-${sheet.id}`} type="button" role="radio" aria-checked={value === sheet.id} title={sheet.name.uk}
          onClick={() => onChange(sheet.id)}
          className={`relative ${box} rounded-full border-2 ${value === sheet.id ? "border-[var(--ink)] ring-2 ring-[var(--ink)] ring-offset-2" : "border-[var(--line)]"}`}
          style={{ background: background(sheet) }}>
          {!sheet.inStock && <span className="absolute -right-1 -bottom-1 rounded-full bg-[var(--card)] px-1 text-[9px] text-[var(--muted)]">зам.</span>}
          <span className="sr-only">{sheet.name.uk}</span>
        </button>
      ))}
    </div>
  );
}
