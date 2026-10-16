"use client";

// Colour swatches of a constructor palette (sign sheets, letters, plaques). Mirror sheets get a
// light gradient; sheets that are made to order carry a small mark.

import { swatchBackground } from "@/lib/client/swatch-background";
import type { SwatchSheet } from "@/types/constructor-ui";

export function SheetSwatches({ sheets, value, onChange, idPrefix, label, size = "md" }: {
  sheets: SwatchSheet[];
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
          style={{ background: swatchBackground(sheet.hex, sheet.mirror ?? sheet.finish === "mirror") }}>
          {!sheet.inStock && <span className="absolute -right-1 -bottom-1 rounded-full bg-[var(--card)] px-1 text-[9px] text-[var(--muted)]">зам.</span>}
          <span className="sr-only">{sheet.name.uk}</span>
        </button>
      ))}
    </div>
  );
}
