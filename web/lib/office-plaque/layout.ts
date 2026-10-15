// Places the engraved lines on the mirror plate of an office plaque (mm, origin at the
// plaque centre, Y down), with the common plaque text fitting (lib/plaques/fit-lines.ts).

import type { OfficePlaqueConfig, OfficePlaqueDesign, OfficePlaqueLayout, OfficePlaqueLinePlacement } from "../../types/office-plaque";
import type { PlaqueLineInput, PlaqueLineMeasure } from "../../types/plaques";
import { fitPlaqueLines } from "../plaques/fit-lines";
import { DEFAULT_OFFICE_PLAQUE_CONFIG } from "./config";

export function computePlaqueLayout(
  design: Pick<OfficePlaqueDesign, "widthMm" | "heightMm" | "lines">, measures: (PlaqueLineMeasure | null)[],
  cfg: OfficePlaqueConfig = DEFAULT_OFFICE_PLAQUE_CONFIG,
): OfficePlaqueLayout {
  const w = design.widthMm;
  const h = design.heightMm;
  const border = Math.min(cfg.borderMm, w / 10, h / 6);
  const plate = { x: -w / 2 + border, y: -h / 2 + border, width: w - 2 * border, height: h - 2 * border };
  const margin = Math.min(cfg.plateMarginMm + plate.height * 0.12, plate.height / 4);
  const zone = { left: plate.x + margin, right: plate.x + plate.width - margin, top: plate.y + margin, bottom: plate.y + plate.height - margin };

  const active: PlaqueLineInput[] = [];
  design.lines.forEach((line, index) => {
    const measure = measures[index];
    if (line.text.trim() && measure && measure.capUnits > 0) active.push({ index, size: Math.min(1.6, Math.max(0.6, line.size)), measure });
  });
  const lines: OfficePlaqueLinePlacement[] = fitPlaqueLines(active, zone).slots.map((slot) => {
    const m = (active.find((a) => a.index === slot.index) as PlaqueLineInput).measure;
    const width = m.widthUnits * slot.scale;
    const height = m.heightUnits * slot.scale;
    return { index: slot.index, x: slot.groupLeft, y: slot.rowTop + (slot.rowHeight - height) / 2, width, height, capMm: slot.capMm, scale: slot.scale };
  });
  return { widthMm: w, heightMm: h, plate, lines };
}
