// Places a wedding initials composition (mm, origin at the top left, Y down): the first letters,
// the separator and the second letters on one baseline. The bar separator reaches a little
// above and below the capitals as on Денис's example; the dot sits at the middle of the capitals.
// As a topper everything stands on a strip with a pointed skewer in the middle.

import type { InitialsConfig, InitialsDesign, InitialsLayout, InitialsShape } from "../../types/initials";
import { DEFAULT_INITIALS_CONFIG } from "./config";
import type { MeasuredInitials } from "./measure";

export function computeInitialsLayout(
  design: Pick<InitialsDesign, "separator" | "letterHeightMm" | "mode">, measured: MeasuredInitials, cfg: InitialsConfig = DEFAULT_INITIALS_CONFIG,
): InitialsLayout {
  const cap = design.letterHeightMm;
  const gap = cap * cfg.gapShare;
  const shapes: InitialsShape[] = [];
  // Work around a baseline at y = 0 and move everything into the positive box at the end.
  let x = 0;
  let pieces = 0;
  const placeText = (key: "first" | "second" | "sep", part: MeasuredInitials["first"], sizeShare = 1) => {
    if (!part) return;
    const scale = (cap * sizeShare) / Math.max(1e-6, part.measure.capUnits);
    shapes.push({ type: "text", key, x, y: -part.measure.baselineUnits * scale, scale });
    x += part.measure.widthUnits * scale + gap;
    pieces += 1;
  };

  placeText("first", measured.first);
  const hasSecond = !!measured.second;
  if (measured.first && hasSecond && design.separator !== "none") {
    if (design.separator === "bar") {
      const width = Math.max(cfg.barMinWidthMm, cap * cfg.barWidthShare);
      const height = cap * cfg.barHeightShare;
      const top = -cap / 2 - height / 2;
      // On a topper the bar stops at the strip instead of hanging below it.
      shapes.push({ type: "rect", x, y: top, width, height: design.mode === "topper" ? -top : height });
      x += width + gap;
      pieces += 1;
    } else if (design.separator === "dot") {
      const r = Math.max(cfg.barMinWidthMm, cap * 0.08);
      shapes.push({ type: "circle", cx: x + r, cy: -cap / 2, r });
      x += 2 * r + gap;
      pieces += 1;
    } else {
      placeText("sep", measured.sep, design.separator === "plus" ? 0.7 : 0.9);
    }
  }
  placeText("second", measured.second);

  // Box of everything placed so far (text boxes from their measures).
  let minY = 0;
  let maxY = 0;
  let maxX = 0;
  for (const s of shapes) {
    if (s.type === "text") {
      const part = s.key === "first" ? measured.first : s.key === "second" ? measured.second : measured.sep;
      if (!part) continue;
      minY = Math.min(minY, s.y);
      maxY = Math.max(maxY, s.y + part.measure.heightUnits * s.scale);
      maxX = Math.max(maxX, s.x + part.measure.widthUnits * s.scale);
    } else if (s.type === "rect") {
      minY = Math.min(minY, s.y); maxY = Math.max(maxY, s.y + s.height); maxX = Math.max(maxX, s.x + s.width);
    } else if (s.type === "circle") {
      minY = Math.min(minY, s.cy - s.r); maxY = Math.max(maxY, s.cy + s.r); maxX = Math.max(maxX, s.cx + s.r);
    }
  }
  let minX = 0;

  if (design.mode === "topper" && shapes.length) {
    const strip = Math.max(cfg.stripMinMm, cap * cfg.stripShare);
    const extend = strip * 0.6;
    const top = -strip * 0.4;
    shapes.push({ type: "rect", x: -extend, y: top, width: maxX + 2 * extend, height: strip });
    const skewerW = Math.max(cfg.skewerMinWidthMm, cap * cfg.skewerWidthShare);
    const skewerL = cap * cfg.skewerLengthShare;
    const cx = maxX / 2;
    const y0 = top + strip - 0.5;
    shapes.push({ type: "poly", points: [[cx - skewerW / 2, y0], [cx + skewerW / 2, y0], [cx + skewerW / 2, y0 + skewerL - skewerW], [cx, y0 + skewerL], [cx - skewerW / 2, y0 + skewerL - skewerW]] });
    minX = -extend;
    maxX += extend;
    maxY = Math.max(maxY, y0 + skewerL);
    pieces = 1;
  }

  const dx = -minX;
  const dy = -minY;
  const moved: InitialsShape[] = shapes.map((s) => {
    if (s.type === "text") return { ...s, x: s.x + dx, y: s.y + dy };
    if (s.type === "rect") return { ...s, x: s.x + dx, y: s.y + dy };
    if (s.type === "circle") return { ...s, cx: s.cx + dx, cy: s.cy + dy };
    return { ...s, points: s.points.map(([px, py]) => [px + dx, py + dy] as [number, number]) };
  });
  return { widthMm: shapes.length ? maxX - minX : 0, heightMm: shapes.length ? maxY - minY : 0, shapes: moved, pieces };
}
