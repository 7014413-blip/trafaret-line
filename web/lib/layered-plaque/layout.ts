// Places a two-layer plaque (mm, origin at the centre of the whole plaque, Y down): the plate,
// the offset back plate of number plaques, the frame or edging and the text lines fitted by the
// common plaque module (lib/plaques/fit-lines.ts). Number plaques keep the number in the lower
// right corner as on Денис's photo; floor and door plaques centre the text inside the frame.

import type { LayeredPlaqueConfig, LayeredPlaqueDesign, LayeredPlaqueLayout, LayeredPlaqueLinePlacement } from "../../types/layered-plaque";
import type { PlaqueLineInput, PlaqueLineMeasure, PlaqueZone } from "../../types/plaques";
import { fitPlaqueLines } from "../plaques/fit-lines";

export function computeLayeredPlaqueLayout(
  design: Pick<LayeredPlaqueDesign, "widthMm" | "heightMm" | "lines" | "frame">, measures: (PlaqueLineMeasure | null)[], cfg: LayeredPlaqueConfig,
): LayeredPlaqueLayout {
  const w = design.widthMm;
  const h = design.heightMm;
  const short = Math.min(w, h);
  const offset = short * cfg.backOffsetShare;
  const plate = { x: -(w + offset) / 2, y: -(h + offset) / 2, width: w, height: h };
  const back = offset > 0 ? { x: plate.x + offset, y: plate.y + offset, width: w, height: h } : null;
  const cornerMm = short * cfg.cornerShare;

  let frame: LayeredPlaqueLayout["frame"] = null;
  let inner = Math.max(5, short * 0.08);
  if (design.frame && cfg.frameWidthShare > 0) {
    const inset = Math.max(3, short * cfg.frameInsetShare);
    const stroke = Math.max(cfg.frameMinWidthMm, short * cfg.frameWidthShare);
    frame = {
      x: plate.x + inset + stroke / 2, y: plate.y + inset + stroke / 2,
      width: w - 2 * inset - stroke, height: h - 2 * inset - stroke,
      corner: Math.max(0, cornerMm - inset - stroke / 2), stroke,
    };
    inner = inset + stroke + Math.max(4, short * 0.07);
  }

  const zone: PlaqueZone = cfg.kind === "number"
    ? { left: plate.x + w * 0.18, right: plate.x + w - short * 0.12, top: plate.y + h * 0.4, bottom: plate.y + h - short * 0.12 }
    : { left: plate.x + inner + cornerMm * 0.3, right: plate.x + w - inner - cornerMm * 0.3, top: plate.y + inner, bottom: plate.y + h - inner };

  const active: PlaqueLineInput[] = [];
  design.lines.forEach((line, index) => {
    const measure = measures[index];
    if (line.text.trim() && measure && measure.capUnits > 0) active.push({ index, size: Math.min(1.6, Math.max(0.6, line.size)), measure });
  });
  const fitted = fitPlaqueLines(active, zone);
  // Number plaques: the block goes to the lower right corner of its zone.
  const lastSlot = fitted.slots[fitted.slots.length - 1];
  const dy = cfg.kind === "number" && lastSlot ? zone.bottom - (lastSlot.rowTop + lastSlot.rowHeight) : 0;

  const lines: LayeredPlaqueLinePlacement[] = fitted.slots.map((slot) => {
    const m = (active.find((a) => a.index === slot.index) as PlaqueLineInput).measure;
    const width = m.widthUnits * slot.scale;
    const height = m.heightUnits * slot.scale;
    const left = cfg.kind === "number" ? zone.right - width : slot.groupLeft;
    return { index: slot.index, x: left, y: slot.rowTop + (slot.rowHeight - height) / 2 + dy, width, height, capMm: slot.capMm, scale: slot.scale };
  });
  return { widthMm: w + offset, heightMm: h + offset, cornerMm, plate, back, frame, lines };
}
