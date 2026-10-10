// Places the text lines, the direction arrow and the logo on a pointer sign (mm, origin at
// the sign centre, Y down). Pure function: the constructor preview, the checks and the
// production file use the same numbers. Layout follows Денис's signs: the logo in a ring
// sits in the tip, the text block fills the rest, every line keeps its relative size.
// The base outline is the «pointer» shape of the sign constructor (lib/calculators/signage.ts).

import type {
  PointerLineMeasure, PointerLinePlacement, PointerLogoPlacement, PointerSignDesign, PointerSignLayout,
} from "../../types/pointer-sign";
import type { SignBase } from "../../types/signage";
import { headLength, signOutline } from "../calculators/signage";
import { arrowGlyphOutline } from "./arrow-glyph";

/** Arrow box per cap height of its line: length, height and the gap to the text. */
const ARROW_LENGTH = 1.9;
const ARROW_HEIGHT = 0.8;
const ARROW_GAP = 0.5;
/** Space between lines as a share of the cap height. */
const LINE_GAP = 0.45;

interface Zone { left: number; right: number; top: number; bottom: number }
interface Fitted { cap: number; blockHeight: number }

type Active = { index: number; size: number; m: PointerLineMeasure; arrow: boolean };

function fitLines(active: Active[], zone: Zone): Fitted {
  const zoneW = Math.max(0, zone.right - zone.left);
  const zoneH = Math.max(0, zone.bottom - zone.top);
  const heightRatio = (a: Active) => a.m.heightUnits / a.m.capUnits;
  const widthRatio = (a: Active) => a.m.widthUnits / a.m.capUnits + (a.arrow ? ARROW_LENGTH + ARROW_GAP : 0);
  let heightPerCap = 0;
  active.forEach((a, i) => {
    heightPerCap += a.size * Math.max(heightRatio(a), a.arrow ? ARROW_HEIGHT : 0);
    if (i < active.length - 1) heightPerCap += LINE_GAP * (a.size + active[i + 1].size) / 2;
  });
  let cap = heightPerCap > 0 ? zoneH / heightPerCap : 0;
  for (const a of active) cap = Math.min(cap, zoneW / Math.max(1e-6, a.size * widthRatio(a)));
  return { cap: Math.max(0, cap), blockHeight: Math.max(0, cap * heightPerCap) };
}

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

  const zone: Zone = { left: -w / 2 + margin, right: textRight, top: -h / 2 + margin, bottom: h / 2 - margin };
  const arrowLine = design.arrow.placement === "none" ? -1 : design.arrow.lineIndex;
  const active: Active[] = design.lines
    .map((line, index) => ({ index, size: line.size, m: measures[index], text: line.text.trim() }))
    .filter((a): a is { index: number; size: number; m: PointerLineMeasure; text: string } => !!a.text && !!a.m && a.m.capUnits > 0)
    .map(({ index, size, m }) => ({ index, size: Math.min(1.6, Math.max(0.6, size)), m, arrow: index === arrowLine }));
  // The arrow goes on the chosen line; if that line is empty, on the last line with text.
  if (arrowLine >= 0 && active.length && !active.some((a) => a.arrow)) active[active.length - 1].arrow = true;

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

  let fitted = fitLines(active, zone);
  if (!design.logo) {
    // Use part of the tip when the text block is low enough to fit there.
    const first = tipAllowance(fitted.blockHeight, h, head, margin);
    if (first > 0.5) {
      const wider = { ...zone, right: zone.right + first };
      const second = fitLines(active, wider);
      if (tipAllowance(second.blockHeight, h, head, margin) >= first - 0.5) { fitted = second; zone.right = wider.right; }
    }
  }

  let y = (zone.top + zone.bottom) / 2 - fitted.blockHeight / 2;
  const centreX = (zone.left + zone.right) / 2;
  active.forEach((a, i) => {
    const cap = fitted.cap * a.size;
    const scale = cap / a.m.capUnits;
    const textW = a.m.widthUnits * scale;
    const textH = a.m.heightUnits * scale;
    const rowH = Math.max(textH, a.arrow ? cap * ARROW_HEIGHT : 0);
    const arrowW = a.arrow ? cap * ARROW_LENGTH : 0;
    const gap = a.arrow ? cap * ARROW_GAP : 0;
    const groupW = textW + arrowW + gap;
    const groupX = flipX(centreX - groupW / 2, groupW);
    const textTop = y + (rowH - textH) / 2;
    const textX = a.arrow && design.arrow.placement === "start" ? groupX + arrowW + gap : groupX;
    lines.push({ index: a.index, x: textX, y: textTop, width: textW, height: textH, capMm: cap, scale });
    if (a.arrow) {
      const ah = cap * ARROW_HEIGHT;
      const ax = design.arrow.placement === "start" ? groupX : groupX + textW + gap;
      // Centred on the capital letters: half a cap above the baseline.
      const ay = textTop + a.m.baselineUnits * scale - cap / 2 - ah / 2;
      arrow = { x: ax, y: ay, width: arrowW, height: ah, points: arrowGlyphOutline(ax, ay, arrowW, ah, dir) };
    }
    y += rowH + (i < active.length - 1 ? LINE_GAP * cap * (1 + active[i + 1].size / a.size) / 2 : 0);
  });

  return { widthMm: w, heightMm: h, outline, textZone: zoneBox(zone, flipX), lines, arrow, logo, marginMm: margin };
}

function zoneBox(zone: Zone, flipX: (x: number, width: number) => number): PointerSignLayout["textZone"] {
  const width = Math.max(0, zone.right - zone.left);
  return { x: flipX(zone.left, width), y: zone.top, width, height: Math.max(0, zone.bottom - zone.top) };
}
