// Sign / pointer / acrylic-letter geometry, checks and price. Pure functions, no DOM:
// the constructor uses them for the live price and the server repeats them before the
// order is accepted (same rule as stencil-math.ts). Spec: research/konstruktor-vyvesok.md.
//
// Approved by Денис 2026-10-08: 18 000 UAH/m² of the overall bounding box, base 3 mm and
// overlay 1–3 mm included, thicker base adds the blank-sheet difference to 3 mm, the
// positioning stencil is 600 UAH/m². The customer never sees m², only sizes and UAH.
// Values marked [default] were chosen by Claude and approved in bulk by Денис 2026-10-08 23:45;
// all of them are admin settings.

import type { BuyerContext, LocalizedText } from "../types/customizer";
import type {
  AcrylicSheet, SignBase, SignCheck, SignDesign, SignLayer, SignPrice, SignPriceLine, SignPricingConfig,
} from "../types/signage";
import type { Hole } from "./export-layers";
import { DEFAULT_PRICING, bestLineDiscount } from "./stencil-math";

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const DEFAULT_SIGN_PRICING: SignPricingConfig = {
  signRatePerM2: 18_000,
  minSignPrice: 1_500,              // [default]
  minLettersPrice: 250,             // [default]
  lettersFactor: 1.5,               // [default]
  separateLettersFactor: 2,         // [default]
  selfAdhesivePerM2: 600,           // [default]
  positioningStencilPerM2: 600,
  whiteLabelPrice: 0,               // [default]
  includedBaseThicknessMm: 3,
  sheetPricePerM2: {
    acrylic: { 1.5: 1_900, 3: 2_900, 6: 6_500, 8: 8_000 },
    mirror: { 2: 5_600, 3: 8_200 },
  },
  holeDiameterMm: 6,
  holeEdgeOffsetMm: 20,
  edgeClearanceMm: 10,
  maxSheetMm: { width: 1_400, height: 2_000 }, // laser bed, ТЗ
  roundTo: 10,
};

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });
const ACRYLIC_T = [1.5, 3, 6, 8];
const MIRROR_T = [2, 3];
const sheet = (
  id: string, name: LocalizedText, hex: string, finish: AcrylicSheet["finish"], inStock = true,
): AcrylicSheet => ({
  id, name, hex, finish, inStock,
  thicknessesMm: finish === "mirror" ? MIRROR_T : ACRYLIC_T,
  minLetterMm: finish === "mirror" ? 25 : 15,   // [default] until tested on the laser
  minStrokeMm: finish === "mirror" ? 3 : 2,     // [default]
});

/** Fallback palette (admin-editable). Rose-gold mirror and brown are "під замовлення" [default]. */
export const ACRYLIC_PALETTE: AcrylicSheet[] = [
  sheet("mirror-silver", t("Дзеркальний срібло", "Зеркальный серебро", "Mirror silver"), "#c9ced6", "mirror"),
  sheet("mirror-gold", t("Дзеркальний золото", "Зеркальный золото", "Mirror gold"), "#d2ae55", "mirror"),
  sheet("mirror-rose", t("Дзеркальний рожеве золото", "Зеркальный розовое золото", "Mirror rose gold"), "#d9a196", "mirror", false),
  sheet("black", t("Чорний глянець", "Чёрный глянец", "Gloss black"), "#15171c", "gloss"),
  sheet("white", t("Білий", "Белый", "White"), "#f4f4f2", "gloss"),
  sheet("clear", t("Прозорий", "Прозрачный", "Clear"), "#ddebf3", "clear"),
  sheet("red", t("Червоний", "Красный", "Red"), "#c62828", "gloss"),
  sheet("orange", t("Помаранчевий", "Оранжевый", "Orange"), "#ef7d1a", "gloss"),
  sheet("yellow", t("Жовтий", "Жёлтый", "Yellow"), "#f2c230", "gloss"),
  sheet("green", t("Зелений", "Зелёный", "Green"), "#2e7d4f", "gloss"),
  sheet("blue", t("Синій", "Синий", "Blue"), "#1f4fa3", "gloss"),
  sheet("brown", t("Коричневий", "Коричневый", "Brown"), "#5b3a25", "gloss", false),
];

const byId = (palette: AcrylicSheet[], id: string): AcrylicSheet => {
  const s = palette.find((p) => p.id === id);
  if (!s) throw new Error(`Unknown acrylic sheet: ${id}`);
  return s;
};

const roundUp = (v: number, step: number) => Math.ceil(v / step) * step;
const HAS_HEIGHT = new Set(["rect", "rounded", "arrow", "pointer"]);

/* ------------------------------------------------------------------ */
/* Geometry (mm, origin at the base centre, Y down)                    */
/* ------------------------------------------------------------------ */

export function baseSize(b: SignBase): { w: number; h: number } {
  return HAS_HEIGHT.has(b.shape) ? { w: b.widthMm, h: b.heightMm } : { w: b.widthMm, h: b.widthMm };
}

/** Length of the arrow head / pointer tip. */
export function headLength(b: SignBase): number {
  const { w, h } = baseSize(b);
  return b.shape === "arrow" ? Math.min(h * 0.75, w * 0.45) : Math.min(h * 0.5, w * 0.3);
}

/** Is (x, y) at least `margin` mm inside the base outline? */
export function insideBase(b: SignBase, x: number, y: number, margin: number): boolean {
  const { w, h } = baseSize(b);
  if (b.shape === "circle") return Math.hypot(x, y) <= w / 2 - margin;
  if (Math.abs(x) > w / 2 - margin || Math.abs(y) > h / 2 - margin) return false;
  if (b.shape === "arrow" || b.shape === "pointer") {
    const xl = x * (b.direction ?? 1), hl = headLength(b);
    if (xl < w / 2 - hl) return b.shape === "arrow" ? Math.abs(y) <= h * 0.22 - margin : true;
    return Math.abs(y) <= ((w / 2 - xl) / hl) * (h / 2) - margin;
  }
  return true;
}

/** Mounting holes, centre coordinates relative to the base centre. */
export function signHoles(b: SignBase, count: 0 | 2 | 4, cfg: SignPricingConfig = DEFAULT_SIGN_PRICING): { x: number; y: number }[] {
  if (!count) return [];
  const { w, h } = baseSize(b), o = cfg.holeEdgeOffsetMm;
  if (b.shape === "circle") {
    const r = w / 2 - o, angles = count === 4 ? [45, 135, 225, 315] : [180, 0];
    return angles.map((a) => ({ x: r * Math.cos((a * Math.PI) / 180), y: -r * Math.sin((a * Math.PI) / 180) }));
  }
  if (b.shape === "arrow" || b.shape === "pointer") {
    const k = b.direction ?? 1, hl = headLength(b);
    if (b.shape === "arrow" || count === 2) return [{ x: k * (-w / 2 + o), y: 0 }, { x: k * (w / 2 - hl * 0.7), y: 0 }];
    return [
      { x: k * (-w / 2 + o), y: -h / 2 + o }, { x: k * (-w / 2 + o), y: h / 2 - o },
      { x: k * (w / 2 - hl - o), y: -h / 2 + o }, { x: k * (w / 2 - hl - o), y: h / 2 - o },
    ];
  }
  const xs = [-w / 2 + o, w / 2 - o], ys = [-h / 2 + o, h / 2 - o];
  return count === 4
    ? [{ x: xs[0], y: ys[0] }, { x: xs[1], y: ys[0] }, { x: xs[0], y: ys[1] }, { x: xs[1], y: ys[1] }]
    : [{ x: xs[0], y: ys[0] }, { x: xs[1], y: ys[0] }];
}

/** Holes in export-layers.ts coordinates (origin at the sheet's top-left corner). */
export function signHolesForExport(b: SignBase, count: 0 | 2 | 4, cfg: SignPricingConfig = DEFAULT_SIGN_PRICING): Hole[] {
  const { w, h } = baseSize(b);
  return signHoles(b, count, cfg).map((p) => ({ x: p.x + w / 2, y: p.y + h / 2, diameterMm: cfg.holeDiameterMm }));
}

/** Base outline as a closed polyline, top-left origin, for CUT_OUTER and the template sheet. */
export function signOutline(b: SignBase): [number, number][] {
  const { w, h } = baseSize(b);
  const sh = (pts: [number, number][]) => pts.map(([x, y]) => [x + w / 2, y + h / 2] as [number, number]);
  if (b.shape === "circle") {
    const r = w / 2, n = Math.max(48, Math.ceil((Math.PI * w) / 2));
    return sh(Array.from({ length: n }, (_, i) => [r * Math.cos((i / n) * 2 * Math.PI), r * Math.sin((i / n) * 2 * Math.PI)]));
  }
  if (b.shape === "arrow" || b.shape === "pointer") {
    const k = b.direction ?? 1, hl = headLength(b), X = (v: number) => v * k;
    const pts: [number, number][] = b.shape === "arrow"
      ? [[X(-w / 2), -h * 0.22], [X(w / 2 - hl), -h * 0.22], [X(w / 2 - hl), -h / 2], [X(w / 2), 0], [X(w / 2 - hl), h / 2], [X(w / 2 - hl), h * 0.22], [X(-w / 2), h * 0.22]]
      : [[X(-w / 2), -h / 2], [X(w / 2 - hl), -h / 2], [X(w / 2), 0], [X(w / 2 - hl), h / 2], [X(-w / 2), h / 2]];
    return sh(pts);
  }
  if (b.shape === "rounded") {
    const c = Math.min(w, h) * 0.12, pts: [number, number][] = [];
    const corner = (cx: number, cy: number, a0: number) => {
      for (let i = 0; i <= 8; i++) { const a = ((a0 + (i / 8) * 90) * Math.PI) / 180; pts.push([cx + c * Math.cos(a), cy + c * Math.sin(a)]); }
    };
    corner(w / 2 - c, -h / 2 + c, -90); corner(w / 2 - c, h / 2 - c, 0); corner(-w / 2 + c, h / 2 - c, 90); corner(-w / 2 + c, -h / 2 + c, 180);
    return sh(pts);
  }
  return sh([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]);
}

/** Union bounding box of all layers (letters mode billing area), mm. */
function layersBox(layers: SignLayer[]): { w: number; h: number } | null {
  const boxes = layers.map((l) => l.bbox).filter((b): b is NonNullable<SignLayer["bbox"]> => !!b);
  if (!boxes.length) return null;
  const x0 = Math.min(...boxes.map((b) => b.x)), x1 = Math.max(...boxes.map((b) => b.x + b.width));
  const y0 = Math.min(...boxes.map((b) => b.y)), y1 = Math.max(...boxes.map((b) => b.y + b.height));
  return { w: x1 - x0, h: y1 - y0 };
}

/* ------------------------------------------------------------------ */
/* Price                                                               */
/* ------------------------------------------------------------------ */

/** Extra UAH/m² for a base thicker than the included 3 mm (never negative). */
export function thicknessExtraPerM2(s: AcrylicSheet, thicknessMm: number, cfg: SignPricingConfig = DEFAULT_SIGN_PRICING): number {
  const table = cfg.sheetPricePerM2[s.finish === "mirror" ? "mirror" : "acrylic"];
  const chosen = table[thicknessMm], included = table[cfg.includedBaseThicknessMm];
  if (chosen == null || included == null) return 0;
  return Math.max(0, chosen - included);
}

const mm = (v: number) => String(Math.round(v));
const sizeLabel = (b: SignBase) => {
  const { w, h } = baseSize(b);
  return b.shape === "circle" ? `Ø${mm(w)} мм` : `${mm(w)} × ${mm(h)} мм`;
};

/**
 * Price of one design line. Sign: area of the overall box × 18 000 + thicker base +
 * options, minimum, then ONE best discount (stencil-math rules, never stacked).
 * Letters: per layer box × sheet rate × factor (1.5 word / 2.0 loose letters), minimum 250.
 */
export function priceSign(
  d: SignDesign, palette: AcrylicSheet[] = ACRYLIC_PALETTE, cfg: SignPricingConfig = DEFAULT_SIGN_PRICING,
  buyer?: BuyerContext, looseLetters = false,
): SignPrice {
  const lines: SignPriceLine[] = [];
  let unit = 0, areaM2 = 0, rate = 0, minApplied = false, needsManager = false;

  if (d.mode === "sign") {
    const { w, h } = baseSize(d.base);
    const baseSheet = byId(palette, d.base.materialId);
    areaM2 = (w * h) / 1e6;
    rate = cfg.signRatePerM2 + thicknessExtraPerM2(baseSheet, d.base.thicknessMm, cfg);
    unit = areaM2 * cfg.signRatePerM2;
    lines.push({ label: `${sizeLabel(d.base)}, ${baseSheet.name.uk.toLowerCase()} ${d.base.thicknessMm} мм`, amount: 0 });
    lines.push({ label: `Шарів: ${d.layers.length}, усі кольори й матеріали вже в ціні`, amount: 0 });
    const extra = areaM2 * (rate - cfg.signRatePerM2);
    if (extra > 0) { unit += extra; lines.push({ label: `Основа ${d.base.thicknessMm} мм замість ${cfg.includedBaseThicknessMm} мм`, amount: roundUp(extra, cfg.roundTo) }); }
    if (d.options.holes) lines.push({ label: `Отвори під кріплення: ${d.options.holes}`, amount: 0 });
    if (d.options.positioningStencil) { const a = areaM2 * cfg.positioningStencilPerM2; unit += a; lines.push({ label: "Монтажний трафарет", amount: roundUp(a, cfg.roundTo) }); }
    if (d.options.selfAdhesive) { const a = areaM2 * cfg.selfAdhesivePerM2; unit += a; lines.push({ label: "Самоклейка на звороті", amount: roundUp(a, cfg.roundTo) }); }
    if (unit < cfg.minSignPrice) { unit = cfg.minSignPrice; minApplied = true; lines.push({ label: `Мінімальна вартість вивіски ${cfg.minSignPrice} грн`, amount: 0 }); }
    const big = Math.max(w, h) > Math.max(cfg.maxSheetMm.width, cfg.maxSheetMm.height) || Math.min(w, h) > Math.min(cfg.maxSheetMm.width, cfg.maxSheetMm.height);
    needsManager = big || !baseSheet.inStock || d.layers.some((l) => !byId(palette, l.materialId).inStock || l.traced);
  } else {
    const factor = looseLetters ? cfg.separateLettersFactor : cfg.lettersFactor;
    for (const l of d.layers) {
      if (!l.bbox) continue;
      const s = byId(palette, l.materialId);
      const table = cfg.sheetPricePerM2[s.finish === "mirror" ? "mirror" : "acrylic"];
      const sheetRate = table[l.thicknessMm] ?? table[3] ?? 0;
      const a = (l.bbox.width * l.bbox.height) / 1e6, part = a * sheetRate * factor;
      areaM2 += a; unit += part;
      lines.push({ label: `${(l.text ?? "Логотип").replace(/\n/g, " ")}: ${mm(l.bbox.width)} × ${mm(l.bbox.height)} мм, ${s.name.uk.toLowerCase()}`, amount: roundUp(part, cfg.roundTo) });
      if (!s.inStock || l.traced) needsManager = true;
    }
    rate = areaM2 ? unit / areaM2 : 0;
    const box = layersBox(d.layers);
    const tplArea = box ? ((box.w + 40) * (box.h + 40)) / 1e6 : 0;
    if (d.options.positioningStencil && tplArea) { const a = tplArea * cfg.positioningStencilPerM2; unit += a; lines.push({ label: "Монтажний трафарет", amount: roundUp(a, cfg.roundTo) }); }
    if (d.options.selfAdhesive) { const a = areaM2 * cfg.selfAdhesivePerM2; unit += a; lines.push({ label: "Самоклейка на звороті", amount: roundUp(a, cfg.roundTo) }); }
    if (unit < cfg.minLettersPrice) { unit = cfg.minLettersPrice; minApplied = true; lines.push({ label: `Мінімальна вартість замовлення ${cfg.minLettersPrice} грн`, amount: 0 }); }
  }
  if (d.options.whiteLabel && cfg.whiteLabelPrice) { unit += cfg.whiteLabelPrice; lines.push({ label: "Без нашого бренду (white-label)", amount: cfg.whiteLabelPrice }); }

  unit = roundUp(unit, cfg.roundTo);
  const disc = bestLineDiscount(d.quantity, areaM2, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  if (disc.value) {
    const floor = d.mode === "sign" ? cfg.minSignPrice : cfg.minLettersPrice;
    unit = Math.max(floor, roundUp(unit * (1 - disc.value), cfg.roundTo));
    lines.push({ label: `${disc.label}: −${Math.round(disc.value * 100)}%`, amount: 0 });
  }
  return {
    unitPrice: unit, total: unit * d.quantity, quantity: d.quantity, lines, needsManager,
    internal: { areaM2, ratePerM2: rate, minApplied, discountPercent: Math.round(disc.value * 100), discountLabel: disc.label },
  };
}

/** Server check: the price the browser showed must match the server's own calculation. */
export function verifySignPrice(d: SignDesign, shownUnitPrice: number, palette?: AcrylicSheet[], cfg?: SignPricingConfig, buyer?: BuyerContext): boolean {
  return priceSign(d, palette, cfg, buyer).unitPrice === shownUnitPrice;
}

/* ------------------------------------------------------------------ */
/* Checks (bounding boxes; the server repeats them on real contours)   */
/* ------------------------------------------------------------------ */

export function checkSign(
  d: SignDesign, palette: AcrylicSheet[] = ACRYLIC_PALETTE, cfg: SignPricingConfig = DEFAULT_SIGN_PRICING,
  strokeRatio: (fontId: string) => number = () => 0.15,
): SignCheck[] {
  const out: SignCheck[] = [];
  const holes = d.mode === "sign" ? signHoles(d.base, d.options.holes, cfg) : [];
  const capR = cfg.holeDiameterMm / 2 + 6; // hole plus the standoff cap

  d.layers.forEach((l, i) => {
    const n = i + 1, s = byId(palette, l.materialId);
    if (!s.inStock) out.push({ level: "warning", code: "out-of-stock", layerId: l.id, message: t(`Шар ${n}: ${s.name.uk.toLowerCase()} під замовлення, строк довший.`, `Слой ${n}: ${s.name.ru.toLowerCase()} под заказ, срок дольше.`, `Layer ${n}: ${s.name.en.toLowerCase()} is made to order, longer lead time.`) });
    if (l.traced) out.push({ level: "warning", code: "traced-needs-review", layerId: l.id, message: t("Логотип з картинки переведено у вектор автоматично. Менеджер перевірить контури перед різанням.", "Логотип из картинки переведён в вектор автоматически. Менеджер проверит контуры перед резкой.", "The logo was traced from an image automatically. A manager checks the outlines before cutting.") });
    if ((l.kind === "text" || l.kind === "arcText") && l.capHeightMm != null) {
      if (l.capHeightMm < s.minLetterMm) out.push({ level: "error", code: "letter-too-small", layerId: l.id, message: t(`Шар ${n}: літери ${mm(l.capHeightMm)} мм, мінімум ${s.minLetterMm} мм.`, `Слой ${n}: буквы ${mm(l.capHeightMm)} мм, минимум ${s.minLetterMm} мм.`, `Layer ${n}: letters are ${mm(l.capHeightMm)} mm, minimum ${s.minLetterMm} mm.`) });
      const stroke = l.capHeightMm * strokeRatio(l.fontId ?? "");
      if (stroke < s.minStrokeMm) out.push({ level: "warning", code: "stroke-too-thin", layerId: l.id, message: t(`Шар ${n}: лінії шрифту ≈${stroke.toFixed(1)} мм, потрібно від ${s.minStrokeMm} мм.`, `Слой ${n}: линии шрифта ≈${stroke.toFixed(1)} мм, нужно от ${s.minStrokeMm} мм.`, `Layer ${n}: font strokes ≈${stroke.toFixed(1)} mm, need at least ${s.minStrokeMm} mm.`) });
    }
    if (d.mode !== "sign" || !l.bbox || l.kind === "arcText" || l.kind === "frame") return;
    const b = l.bbox, corners: [number, number][] = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]];
    if (l.kind !== "logoColor" && corners.some(([x, y]) => !insideBase(d.base, x, y, cfg.edgeClearanceMm)))
      out.push({ level: "error", code: "too-close-to-edge", layerId: l.id, message: t(`Шар ${n} ближче ніж ${cfg.edgeClearanceMm} мм до краю.`, `Слой ${n} ближе ${cfg.edgeClearanceMm} мм к краю.`, `Layer ${n} is closer than ${cfg.edgeClearanceMm} mm to the edge.`) });
    if (l.kind !== "logoColor" && holes.some((p) => p.x > b.x - capR && p.x < b.x + b.width + capR && p.y > b.y - capR && p.y < b.y + b.height + capR))
      out.push({ level: "error", code: "hole-on-layer", layerId: l.id, message: t(`Отвір під кріплення потрапляє на шар ${n}.`, `Отверстие под крепёж попадает на слой ${n}.`, `A mounting hole lands on layer ${n}.`) });
  });

  if (d.mode === "sign") {
    const { w, h } = baseSize(d.base);
    if (Math.max(w, h) > Math.max(cfg.maxSheetMm.width, cfg.maxSheetMm.height) || Math.min(w, h) > Math.min(cfg.maxSheetMm.width, cfg.maxSheetMm.height))
      out.push({ level: "warning", code: "too-large", message: t("Більше за робоче поле лазера: виготовимо з частин, менеджер узгодить.", "Больше рабочего поля лазера: изготовим из частей, менеджер согласует.", "Larger than the laser bed: made in parts, a manager will confirm.") });
    const frame = d.layers.find((l) => l.kind === "frame");
    if (frame && d.base.shape === "circle" && holes.length) {
      const R = w / 2, inset = frame.frameInsetMm ?? 0, fw = frame.frameWidthMm ?? 0;
      if (holes.some((p) => { const r = Math.hypot(p.x, p.y); return r > R - inset - fw - capR && r < R - inset + capR; }))
        out.push({ level: "warning", code: "frame-on-holes", layerId: frame.id, message: t(`Отвори потрапляють на рамку. Збільште відступ рамки до ${cfg.holeEdgeOffsetMm + cfg.holeDiameterMm + 4} мм.`, `Отверстия попадают на рамку. Увеличьте отступ рамки до ${cfg.holeEdgeOffsetMm + cfg.holeDiameterMm + 4} мм.`, `Holes land on the frame. Increase the frame inset to ${cfg.holeEdgeOffsetMm + cfg.holeDiameterMm + 4} mm.`) });
    }
  }
  return out;
}
