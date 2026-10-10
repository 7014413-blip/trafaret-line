// Places the text lines, the direction arrow and the logo on a pointer sign (mm, origin at
// the sign centre, Y down). Pure function: the constructor preview, the checks and the
// production file use the same numbers. Layout follows Денис's signs: the logo in a ring
// sits in the tip, the text block fills the rest, every line keeps its relative size.
// The base outline is the «pointer» shape of the sign constructor (lib/calculators/signage.ts);
// the text block is fitted by the common plaque module (lib/plaques/fit-lines.ts).

import type {
  PointerLineMeasure, PointerLinePlacement, PointerLogoPlacement, PointerSignDesign, PointerSignLayout,
} from "../../types/pointer-sign";
import type { SignBase } from "../../types/signage";
import { headLength, signOutline } from "../calculators/signage";
import type { PlaqueLineInput, PlaqueZone } from "../../types/plaques";
import { fitPlaqueLines } from "../plaques/fit-lines";
import { arrowGlyphOutline } from "./arrow-glyph";

/** Arrow box per cap height of its line: length, height and the gap to the text. */
const ARROW_LENGTH = 1.9;
const ARROW_HEIGHT = 0.8;
const ARROW_GAP = 0.5;

/** How far the text block may go into the tip and stay `margin` away from its slanted edges. */
function tipAllowance(blockHeight: number, h: number, head: number, margin: number): number {
  return Math.max(0, head * (1 - (blockHeight / 2 + margin) / (h / 2)));
}

export function computePointerLayout(
  design: Pick<PointerSignDesign, "widthMm" | "heightMm" | "direction" | "lines" | "arrow" | "logo">,
  measures: (PointerLineMeasure | null)[],
): PointerSignLayout {
  const w = design.widthMm;
  const h = design.heightMm;
  const dir = design.direction;
  const base: SignBase = { shape: "pointer", widthMm: w, heightMm: h, direction: dir, materialId: "", thicknessMm: 3 };
  const head = headLength(base);
  const margin = Math.max(6, h * 0.1);
  const outline = signOutline(base).map(([x, y]) => [x - w / 2, y - h / 2] as [number, number]);
  // Work with the tip on the right (+x); mirror the boxes at the end for a left pointer.
  const flipX = (x: number, width: number) => (dir === 1 ? x : -(x + width));

  let logo: PointerLogoPlacement | null = null;
  let textRight = w / 2 - head - margin * 0.3;
  if (design.logo) {
    const radius = h / 2 - margin;
    const slant = Math.hypot(head, h / 2);
    const cx = Math.max(-w / 2 + margin + radius, w / 2 - ((radius + margin * 0.6) * slant) / (h / 2));
    const ringWidth = design.logo.ring ? Math.max(2.5, radius * 0.06) : 0;
    const inner = design.logo.ring ? radius - ringWidth - radius * 0.14 : radius * 0.95;
    const a = Math.max(0.05, design.logo.aspect);
    // The picture's box is inscribed in the circle of radius `inner`.
    const boxWidth = (2 * inner * a) / Math.hypot(1, a);
    const boxHeight = (2 * inner) / Math.hypot(1, a);
    logo = { cx: dir === 1 ? cx : -cx, cy: 0, boxWidth, boxHeight, ringRadius: design.logo.ring ? radius - ringWidth / 2 : 0, ringWidth };
    textRight = cx - radius - margin * 0.8;
  }

  const zone: PlaqueZone = { left: -w / 2 + margin, right: textRight, top: -h / 2 + margin, bottom: h / 2 - margin };
  const arrowLine = design.arrow.placement === "none" ? -1 : design.arrow.lineIndex;
  const active: PlaqueLineInput[] = [];
  design.lines.forEach((line, index) => {
    const measure = measures[index];
    if (!line.text.trim() || !measure || measure.capUnits <= 0) return;
    active.push({ index, size: Math.min(1.6, Math.max(0.6, line.size)), measure });
  });
  // The arrow goes on the chosen line; if that line is empty, on the last line with text.
  const arrowOn = arrowLine < 0 || !active.length ? null : active.find((a) => a.index === arrowLine) ?? active[active.length - 1];
  if (arrowOn) { arrowOn.extraWidthPerCap = ARROW_LENGTH + ARROW_GAP; arrowOn.minRowPerCap = ARROW_HEIGHT; }

  const lines: PointerLinePlacement[] = [];
  let arrow: PointerSignLayout["arrow"] = null;

  if (!active.length) {
    if (design.arrow.placement !== "none") {
      const zw = zone.right - zone.left;
      const zh = zone.bottom - zone.top;
      const cap = Math.max(0, Math.min((zh * 0.6) / ARROW_HEIGHT, (zw * 0.8) / ARROW_LENGTH));
      const aw = cap * ARROW_LENGTH;
      const ah = cap * ARROW_HEIGHT;
      const x = flipX((zone.left + zone.right) / 2 - aw / 2, aw);
      arrow = { x, y: -ah / 2, width: aw, height: ah, points: arrowGlyphOutline(x, -ah / 2, aw, ah, dir) };
    }
    return { widthMm: w, heightMm: h, outline, textZone: zoneBox(zone, flipX), lines, arrow, logo, marginMm: margin };
  }

  let fitted = fitPlaqueLines(active, zone);
  if (!design.logo) {
    // Use part of the tip when the text block is low enough to fit there.
    const first = tipAllowance(fitted.blockHeight, h, head, margin);
    if (first > 0.5) {
      const wider = { ...zone, right: zone.right + first };
      const second = fitPlaqueLines(active, wider);
      if (tipAllowance(second.blockHeight, h, head, margin) >= first - 0.5) { fitted = second; zone.right = wider.right; }
    }
  }

  for (const slot of fitted.slots) {
    const a = active.find((x) => x.index === slot.index) as PlaqueLineInput;
    const textW = a.measure.widthUnits * slot.scale;
    const textH = a.measure.heightUnits * slot.scale;
    const hasArrow = a === arrowOn;
    const arrowW = hasArrow ? slot.capMm * ARROW_LENGTH : 0;
    const gap = hasArrow ? slot.capMm * ARROW_GAP : 0;
    const groupX = flipX(slot.groupLeft, slot.groupWidth);
    const textTop = slot.rowTop + (slot.rowHeight - textH) / 2;
    const textX = hasArrow && design.arrow.placement === "start" ? groupX + arrowW + gap : groupX;
    lines.push({ index: slot.index, x: textX, y: textTop, width: textW, height: textH, capMm: slot.capMm, scale: slot.scale });
    if (hasArrow) {
      const ah = slot.capMm * ARROW_HEIGHT;
      const ax = design.arrow.placement === "start" ? groupX : groupX + textW + gap;
      // Centred on the capital letters: half a cap above the baseline.
      const ay = textTop + a.measure.baselineUnits * slot.scale - slot.capMm / 2 - ah / 2;
      arrow = { x: ax, y: ay, width: arrowW, height: ah, points: arrowGlyphOutline(ax, ay, arrowW, ah, dir) };
    }
  }

  return { widthMm: w, heightMm: h, outline, textZone: zoneBox(zone, flipX), lines, arrow, logo, marginMm: margin };
}

function zoneBox(zone: PlaqueZone, flipX: (x: number, width: number) => number): PointerSignLayout["textZone"] {
  const width = Math.max(0, zone.right - zone.left);
  return { x: flipX(zone.left, width), y: zone.top, width, height: Math.max(0, zone.bottom - zone.top) };
}
