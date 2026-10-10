// Common text block of the plaque constructors (pointer signs, office plaques): lines with
// their own relative size are fitted into a zone and stacked, centred. Pure function, mm,
// Y down. A line may reserve extra width and a minimum row height per cap height (for
// example the small direction arrow of a pointer sign).

import type { PlaqueLineInput, PlaqueLineSlot, PlaqueZone } from "../../types/plaques";

/** Space between lines as a share of the cap height. */
export const PLAQUE_LINE_GAP = 0.45;

export function fitPlaqueLines(lines: PlaqueLineInput[], zone: PlaqueZone): { cap: number; blockHeight: number; slots: PlaqueLineSlot[] } {
  const zoneW = Math.max(0, zone.right - zone.left);
  const zoneH = Math.max(0, zone.bottom - zone.top);
  const rowPerCap = (l: PlaqueLineInput) => Math.max(l.measure.heightUnits / l.measure.capUnits, l.minRowPerCap ?? 0);
  const widthPerCap = (l: PlaqueLineInput) => l.measure.widthUnits / l.measure.capUnits + (l.extraWidthPerCap ?? 0);

  let heightPerCap = 0;
  lines.forEach((l, i) => {
    heightPerCap += l.size * rowPerCap(l);
    if (i < lines.length - 1) heightPerCap += PLAQUE_LINE_GAP * (l.size + lines[i + 1].size) / 2;
  });
  let cap = heightPerCap > 0 ? zoneH / heightPerCap : 0;
  for (const l of lines) cap = Math.min(cap, zoneW / Math.max(1e-6, l.size * widthPerCap(l)));
  cap = Math.max(0, cap);
  const blockHeight = cap * heightPerCap;

  const slots: PlaqueLineSlot[] = [];
  let y = (zone.top + zone.bottom) / 2 - blockHeight / 2;
  const centreX = (zone.left + zone.right) / 2;
  lines.forEach((l, i) => {
    const lineCap = cap * l.size;
    const scale = lineCap / l.measure.capUnits;
    const rowHeight = lineCap * rowPerCap(l);
    const groupWidth = lineCap * widthPerCap(l);
    slots.push({ index: l.index, capMm: lineCap, scale, rowTop: y, rowHeight, groupLeft: centreX - groupWidth / 2, groupWidth });
    y += rowHeight + (i < lines.length - 1 ? PLAQUE_LINE_GAP * cap * (l.size + lines[i + 1].size) / 2 : 0);
  });
  return { cap, blockHeight, slots };
}
