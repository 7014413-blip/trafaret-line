// Stencil geometry and pricing. Pure functions, no DOM: the same module runs in the
// browser (live price) and on the server (Medusa price check before the order is
// accepted), so the customer never sees one price and pays another (ТЗ §3.3).
//
// Rates below are fallbacks from the owner's numbers (2026-10-08). In production
// they are loaded from Medusa; the final price grid is approved in the dev thread.

import type {
  Bridge, ComplexityFactor, Contour, DesignCheck, LocalizedText, MaterialColour, MaterialOption, MaterialType,
  BuyerContext, PriceBreakdown, PricingConfig, SheetSize, StencilVectorMetrics, VectorDesign,
} from "../types/customizer";

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const SHEET = { width: 1400, height: 2000 }; // laser bed, ТЗ

export const DEFAULT_PRICING: PricingConfig = {
  roundStencilTo: 10,
  roundBlankTo: 1,
  blankOrderMin: 200,                                                         // [Предложение]
  blankTiers: [{ minQty: 10, discount: 0.1 }, { minQty: 50, discount: 0.15 }],  // [Предложение], capped at 15 %
  // Admin setting. Денис 2026-10-08: wholesale at most 15 %.
  stencilTiers: [{ minQty: 10, discount: 0.05 }, { minQty: 50, discount: 0.1 }, { minQty: 100, discount: 0.15 }],
  maxWholesaleDiscount: 0.15,
  wholesaleProgram: { enabled: true, discount: 0.2, monthlyThresholdUah: 10_000, graceMonths: 1, singleOrderQualifies: true },
  loyaltyTiers: [{ minLifetimeUah: 3_000, discount: 0.03 }, { minLifetimeUah: 7_000, discount: 0.05 }, { minLifetimeUah: 15_000, discount: 0.07 }], // [proposal]
  firstOrderDiscount: 0.1,   // [proposal] for email / Viber subscription
  maxRetailDiscount: 0.15,
  minMarkup: 0.3,            // [proposal]
  largeAreaTiers: [{ minM2: 1, discount: 0.1 }, { minM2: 3, discount: 0.15 }], // [Предложение], under the 15 % cap
  machineSheetMm: SHEET,
  compositeSurcharge: 0.05,                                                   // [Предложение]
  minBridgeMm: 2.5,
  minPartMm: 1.5,
};

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });
const C = {
  clear: { id: "clear", name: t("Прозорий", "Прозрачный", "Clear"), hex: "#eef6fb" },
  white: { id: "white", name: t("Білий", "Белый", "White"), hex: "#ffffff" },
  black: { id: "black", name: t("Чорний", "Чёрный", "Black"), hex: "#16181b" },
  gold: { id: "gold", name: t("Золото", "Золото", "Gold"), hex: "#d4af37" },
  silver: { id: "silver", name: t("Срібло", "Серебро", "Silver"), hex: "#c9d0d6" },
} satisfies Record<string, MaterialColour>;

type Base = Pick<MaterialOption, "costPerM2" | "foodSafe" | "magnetic" | "maxDimensionsMm" | "available">;
const base: Base = { costPerM2: null, foodSafe: false, magnetic: false, maxDimensionsMm: SHEET, available: true };
const look = (face: string, edge: string, opacity: number, gloss: number) => ({ face, edge, opacity, gloss });

/**
 * Fallback catalogue. Rates: owner 2026-10-08 (stencils) and ТЗ «Материалы заготовок» (blanks).
 * null price = not given yet. Food-contact: false everywhere until supplier documents exist.
 */
export const MATERIALS: Record<MaterialType, MaterialOption> = {
  pet_thin: { ...base, id: "pet_thin", use: "stencil", name: t("PET 0,5 мм", "PET 0,5 мм", "PET 0.5 mm"), thicknessMm: 0.5, densityGcm3: 1.38,
    baseSquareMeterPrice: 2200, minPrice: 150, finish: "clear", colours: [C.clear], minLetterMm: 8, look: look("#e4f0ff", "#b9cde6", 0.55, 0.8),
    note: t("Гнучкий, щільно лягає на крем і піну", "Гибкий, плотно ложится на крем и пену", "Flexible, sits flat on cream and foam") },
  pet_thick: { ...base, id: "pet_thick", use: "stencil", name: t("PET товстий", "PET толстый", "Thick PET"), thicknessMm: 1, densityGcm3: 1.38, // thickness to confirm
    baseSquareMeterPrice: null, minPrice: 150, finish: "clear", colours: [C.clear], minLetterMm: 10, look: look("#e4f0ff", "#a9c2e0", 0.55, 0.8),
    note: t("Товщину і ціну уточнюємо", "Толщину и цену уточняем", "Thickness and price to be confirmed"), available: false },
  polystyrene: { ...base, id: "polystyrene", use: "stencil", name: t("Полістирол 1 мм", "Полистирол 1 мм", "Polystyrene 1 mm"), thicknessMm: 1, densityGcm3: 1.05,
    baseSquareMeterPrice: 2300, minPrice: 150, finish: "matte", colours: [C.white, C.black], minLetterMm: 10, look: look("#f5f6f7", "#c9ced4", 0.92, 0.35),
    note: t("Тримає форму, для фарби на стінах і металі", "Держит форму, для краски на стенах и металле", "Holds shape, for paint on walls and metal") },
  acrylic: { ...base, id: "acrylic", use: "stencil", name: t("Акрил 3 мм", "Акрил 3 мм", "Acrylic 3 mm"), thicknessMm: 3, densityGcm3: 1.19,
    baseSquareMeterPrice: 4000, minPrice: 250, finish: "clear", colours: [C.clear], minLetterMm: 15, look: look("#e2f7f1", "#9fd6c6", 0.5, 1),
    note: t("Жорсткий, для штукатурки і багаторазової роботи", "Жёсткий, для штукатурки и многоразовой работы", "Rigid, for plaster and repeated use") },
  magnetic: { ...base, id: "magnetic", use: "stencil", name: t("Магнітний лист 0,9 мм", "Магнитный лист 0,9 мм", "Magnetic sheet 0.9 mm"), thicknessMm: 0.9, densityGcm3: 3.6,
    baseSquareMeterPrice: null, minPrice: 150, magnetic: true, finish: "matte", colours: [C.black], minLetterMm: 12, look: look("#3a3d42", "#24272b", 1, 0.15),
    note: t("Тримається на металі без клею", "Держится на металле без клея", "Sticks to metal without glue"), available: false },
  plywood: { ...base, id: "plywood", use: "stencil", name: t("Фанера 3 мм", "Фанера 3 мм", "Plywood 3 mm"), thicknessMm: 3, densityGcm3: 0.65,
    baseSquareMeterPrice: null, minPrice: 150, finish: "matte", colours: [], minLetterMm: 15, look: look("#d9b98c", "#a87b4a", 1, 0.1),
    note: t("Для декору і багаторазових шаблонів", "Для декора и многоразовых шаблонов", "For decor and reusable templates"), available: false },
  stainless_steel: { ...base, id: "stainless_steel", use: "stencil", name: t("Нержавіюча сталь 0,5 мм", "Нержавеющая сталь 0,5 мм", "Stainless steel 0.5 mm"), thicknessMm: 0.5, densityGcm3: 7.9,
    baseSquareMeterPrice: null, minPrice: 500, finish: "matte", colours: [C.silver], minLetterMm: 8, look: look("#c9d0d6", "#8d969f", 1, 0.9),
    note: t("Для маркування фарбою тисячі разів", "Для маркировки краской тысячи раз", "For thousands of paint markings"), available: false },

  acrylic_1_5: { ...base, id: "acrylic_1_5", use: "blank", name: t("Акрил 1,5 мм", "Акрил 1,5 мм", "Acrylic 1.5 mm"), thicknessMm: 1.5, densityGcm3: 1.19,
    baseSquareMeterPrice: 1900, minPrice: 0, finish: "gloss", colours: [C.clear, C.white, C.black], minLetterMm: 0, look: look("#eef7fb", "#b6d9e3", 0.5, 1), note: t("Заготовка", "Заготовка", "Blank") },
  acrylic_3: { ...base, id: "acrylic_3", use: "blank", name: t("Акрил 3 мм", "Акрил 3 мм", "Acrylic 3 mm"), thicknessMm: 3, densityGcm3: 1.19,
    baseSquareMeterPrice: 2900, minPrice: 0, finish: "gloss", colours: [C.clear, C.white, C.black], minLetterMm: 0, look: look("#e2f7f1", "#9fd6c6", 0.5, 1), note: t("Заготовка", "Заготовка", "Blank") },
  acrylic_6: { ...base, id: "acrylic_6", use: "blank", name: t("Акрил 6 мм", "Акрил 6 мм", "Acrylic 6 mm"), thicknessMm: 6, densityGcm3: 1.19,
    baseSquareMeterPrice: 6500, minPrice: 0, finish: "gloss", colours: [C.clear, C.white, C.black], minLetterMm: 0, look: look("#e2f7f1", "#8ccbb9", 0.5, 1), note: t("Заготовка", "Заготовка", "Blank") },
  acrylic_8: { ...base, id: "acrylic_8", use: "blank", name: t("Акрил 8 мм", "Акрил 8 мм", "Acrylic 8 mm"), thicknessMm: 8, densityGcm3: 1.19,
    baseSquareMeterPrice: 8000, minPrice: 0, finish: "gloss", colours: [C.clear, C.white, C.black], minLetterMm: 0, look: look("#e2f7f1", "#7fc1ae", 0.5, 1), note: t("Заготовка", "Заготовка", "Blank") },
  acrylic_color: { ...base, id: "acrylic_color", use: "blank", name: t("Кольоровий акрил 3 мм", "Цветной акрил 3 мм", "Coloured acrylic 3 mm"), thicknessMm: 3, densityGcm3: 1.19, // thickness to confirm
    baseSquareMeterPrice: 5200, minPrice: 0, finish: "gloss", colours: [], minLetterMm: 0, look: look("#f2b8c6", "#d98ea1", 0.85, 1),
    note: t("Палітру кольорів задаємо в адмінці", "Палитру цветов задаём в админке", "Colour palette is set in the admin") },
  acrylic_mirror_2: { ...base, id: "acrylic_mirror_2", use: "blank", name: t("Дзеркальний акрил 2 мм", "Зеркальный акрил 2 мм", "Mirror acrylic 2 mm"), thicknessMm: 2, densityGcm3: 1.19,
    baseSquareMeterPrice: 5600, minPrice: 0, finish: "mirror", colours: [C.gold, C.silver], minLetterMm: 0, look: look("#d9dee3", "#9aa3ab", 1, 1), note: t("Заготовка", "Заготовка", "Blank") },
  acrylic_mirror_3: { ...base, id: "acrylic_mirror_3", use: "blank", name: t("Дзеркальний акрил 3 мм", "Зеркальный акрил 3 мм", "Mirror acrylic 3 mm"), thicknessMm: 3, densityGcm3: 1.19,
    baseSquareMeterPrice: 8200, minPrice: 0, finish: "mirror", colours: [C.gold, C.silver], minLetterMm: 0, look: look("#d9dee3", "#8d969f", 1, 1), note: t("Заготовка", "Заготовка", "Blank") },
  polystyrene_mirror_1: { ...base, id: "polystyrene_mirror_1", use: "blank", name: t("Дзеркальний полістирол 1 мм", "Зеркальный полистирол 1 мм", "Mirror polystyrene 1 mm"), thicknessMm: 1, densityGcm3: 1.05,
    baseSquareMeterPrice: 3600, minPrice: 0, finish: "mirror", colours: [C.gold, C.silver], minLetterMm: 0, look: look("#dfe3e7", "#a3abb3", 1, 1), note: t("Заготовка", "Заготовка", "Blank") },
  pet_food_board: { ...base, id: "pet_food_board", use: "blank", name: t("PET 0,5 мм, підкладка під торт", "PET 0,5 мм, подложка под торт", "PET 0.5 mm cake board"), thicknessMm: 0.5, densityGcm3: 1.38,
    baseSquareMeterPrice: 1800, minPrice: 0, finish: "clear", colours: [C.clear], minLetterMm: 0, look: look("#e4f0ff", "#b9cde6", 0.55, 0.8),
    note: t("Підкладка під торт", "Подложка под торт", "Cake board") },
};

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const dist = (a: readonly [number, number], b: readonly [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Length of one contour in mm (closing segment included for closed contours). */
export function contourLength(c: Contour): number {
  const p = c.points;
  let len = 0;
  for (let i = 1; i < p.length; i++) len += dist(p[i - 1], p[i]);
  if (c.closed && p.length > 2) len += dist(p[p.length - 1], p[0]);
  return len;
}

/** Signed area by the shoelace formula, mm². Positive = counter-clockwise. */
export function contourArea(c: Contour): number {
  const p = c.points;
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/**
 * Total laser cut length, mm: all design contours, minus the gaps left by bridges
 * (a bridge crosses a stroke, so it interrupts two contour edges, 2 × its width),
 * plus the outer sheet outline. Used for machine time and the production sheet.
 */
export function cutLengthMm(design: VectorDesign, sheet: SheetSize, bridges: Bridge[] = design.bridges): number {
  const inner = design.contours.reduce((s, c) => s + contourLength(c), 0);
  const saved = bridges.reduce((s, b) => s + b.widthMm * 2, 0);
  return Math.max(0, inner - saved) + sheetPerimeterMm(sheet);
}

export function sheetPerimeterMm(s: SheetSize): number {
  if (s.shape === "circle") return Math.PI * s.widthMm;
  if (s.shape === "oval") {
    // Ramanujan approximation
    const a = s.widthMm / 2, b = s.heightMm / 2;
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  }
  return 2 * (s.widthMm + s.heightMm);
}

/** Billing area: bounding rectangle of the sheet for every shape (ТЗ §3.3), m². */
export function billingAreaM2(s: SheetSize): number {
  return (s.widthMm * s.heightMm) / 1_000_000;
}

/** Real material area of the shape, m² (for weight). */
export function shapeAreaM2(s: SheetSize): number {
  const r = (s.widthMm * s.heightMm) / 1_000_000;
  return s.shape === "circle" || s.shape === "oval" ? (r * Math.PI) / 4 : r;
}

/** Sheet weight in grams. */
export function weightG(s: SheetSize, m: MaterialOption): number {
  return shapeAreaM2(s) * 10_000 * (m.thicknessMm / 10) * m.densityGcm3;
}

/** How many machine sheets a large stencil is split into. */
export function piecesFor(s: SheetSize, max: { width: number; height: number } = SHEET): number {
  const { width: w, height: h } = max;
  const fit = (a: number, b: number) => Math.ceil(a / w) * Math.ceil(b / h);
  return Math.min(fit(s.widthMm, s.heightMm), fit(s.heightMm, s.widthMm));
}

/**
 * Sheet size for a text design: width chosen by the customer, height follows the
 * text proportions plus the margin on both sides (default 15 mm).
 */
export function sheetForDesign(design: VectorDesign, widthMm: number, marginMm = 15): SheetSize {
  const inner = Math.max(1, widthMm - 2 * marginMm);
  const scale = inner / Math.max(1, design.bboxMm.w);
  return { shape: "rect", widthMm, heightMm: Math.ceil(design.bboxMm.h * scale + 2 * marginMm) };
}

/**
 * Bridges for hole contours that are not already bridged. One bridge at the top of the
 * hole for small holes, two (top and bottom) when the hole is taller than 20 mm.
 * The constructor then cuts the hole contour at these points.
 */
export function generateBridges(design: VectorDesign, cfg: PricingConfig = DEFAULT_PRICING): Bridge[] {
  if (design.stencilFont) return [];
  const out: Bridge[] = [];
  design.contours.forEach((c, i) => {
    if (!c.isHole || !c.closed || c.points.length < 3) return;
    let top = c.points[0], bottom = c.points[0];
    for (const p of c.points) { if (p[1] < top[1]) top = p; if (p[1] > bottom[1]) bottom = p; }
    out.push({ contourIndex: i, at: top, widthMm: cfg.minBridgeMm });
    if (bottom[1] - top[1] > 20) out.push({ contourIndex: i, at: bottom, widthMm: cfg.minBridgeMm });
  });
  return out;
}

/** Денис's StencilVectorMetrics for a design on a sheet. */
export function computeMetrics(design: VectorDesign, sheet: SheetSize, m: MaterialOption): StencilVectorMetrics {
  const bridges = design.bridges.length ? design.bridges : generateBridges(design);
  return {
    widthMm: sheet.widthMm,
    heightMm: sheet.heightMm,
    pathLengthMeters: cutLengthMm(design, sheet, bridges) / 1000,
    areaSquareMeters: billingAreaM2(sheet),
    bridgeCount: bridges.length,
    isClosedLoopValid: design.contours.every((c) => c.closed),
    pieces: piecesFor(sheet, m.maxDimensionsMm),
  };
}

/** Design checks shown in the constructor (algoritm-konstruktora.md, step 6). */
export function checkDesign(design: VectorDesign, sheet: SheetSize, m: MaterialOption, capHeightMm?: number, cfg: PricingConfig = DEFAULT_PRICING): DesignCheck[] {
  const out: DesignCheck[] = [];
  if (!design.contours.length)
    out.push({ code: "empty", level: "error", message: t("Додайте напис або файл", "Добавьте надпись или файл", "Add text or a file") });
  if (capHeightMm != null && capHeightMm < m.minLetterMm)
    out.push({ code: "letter_too_small", level: "warning", message: t(
      `Літери ${capHeightMm.toFixed(0)} мм, для цього матеріалу краще від ${m.minLetterMm} мм`,
      `Буквы ${capHeightMm.toFixed(0)} мм, для этого материала лучше от ${m.minLetterMm} мм`,
      `Letters are ${capHeightMm.toFixed(0)} mm; ${m.minLetterMm} mm or more cuts cleanly in this material`) });
  if (design.contours.some((c) => !c.closed))
    out.push({ code: "open_contour", level: "error", message: t("У файлі є незамкнені контури", "В файле есть незамкнутые контуры", "The file has open contours") });
  const pieces = piecesFor(sheet, m.maxDimensionsMm);
  if (pieces > 1) {
    const pct = Math.round(cfg.compositeSurcharge * 100);
    out.push({ code: "sheet_too_big", level: "warning", message: t(
      `Буде складений з ${pieces} частин, +${pct}%`, `Будет составлен из ${pieces} частей, +${pct}%`, `Made of ${pieces} parts, +${pct}%`) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

const roundUp = (v: number, step: number) => Math.ceil(v / step) * step;
const bestDiscount = <T extends { discount: number }>(list: T[], pick: (x: T) => boolean) =>
  list.filter(pick).reduce((best, x) => (x.discount > best ? x.discount : best), 0);

/**
 * Is the wholesale programme price active for this buyer right now?
 * Approved wholesaler AND (grace period after approval OR previous calendar month paid
 * turnover ≥ threshold OR this order alone ≥ threshold). Otherwise the normal quantity scale.
 */
export function wholesaleProgramActive(buyer: BuyerContext | undefined, cfg: PricingConfig = DEFAULT_PRICING, now = new Date()): boolean {
  const p = cfg.wholesaleProgram;
  if (!p.enabled || !buyer || buyer.wholesaleStatus !== "approved") return false;
  if (buyer.approvedAt) {
    const a = new Date(buyer.approvedAt);
    const monthsSince = (now.getFullYear() - a.getFullYear()) * 12 + (now.getMonth() - a.getMonth());
    if (monthsSince < p.graceMonths) return true;
  }
  if (buyer.previousMonthPaidUah >= p.monthlyThresholdUah) return true;
  return p.singleOrderQualifies && (buyer.currentOrderUah ?? 0) >= p.monthlyThresholdUah;
}

/** Retail loyalty level for lifetime paid orders (server side). */
export function loyaltyFor(lifetimePaidUah: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  return bestDiscount(cfg.loyaltyTiers, (x) => lifetimePaidUah >= x.minLifetimeUah);
}

/**
 * Discounts never stack (Денис 2026-10-08): every candidate is computed and the largest
 * one applies. Retail candidates are capped at maxRetailDiscount (15 %); the wholesale
 * programme (20 %) is the only one above it.
 */
export function bestLineDiscount(
  quantity: number, areaM2: number, tiers: PricingConfig["stencilTiers"], cfg: PricingConfig, buyer?: BuyerContext,
): { value: number; label: string } {
  const cap = (v: number) => Math.min(cfg.maxRetailDiscount, v);
  const candidates: { value: number; label: string }[] = [
    { value: cap(bestDiscount(tiers, (x) => quantity >= x.minQty)), label: "Опт за кількість" },
    { value: cap(bestDiscount(cfg.largeAreaTiers, (x) => areaM2 >= x.minM2)), label: "Великий формат" },
    { value: cap(buyer?.loyaltyDiscount ?? 0), label: "Постійний клієнт" },
    { value: buyer?.firstOrder ? cap(cfg.firstOrderDiscount) : 0, label: "Перше замовлення" },
    { value: cap(buyer?.promo?.discount ?? 0), label: buyer?.promo?.label ?? `Промокод ${buyer?.promo?.code ?? ""}` },
    { value: wholesaleProgramActive(buyer, cfg) ? cfg.wholesaleProgram.discount : 0, label: "Оптова програма" },
  ];
  return candidates.reduce((best, c) => (c.value > best.value ? c : best), { value: 0, label: "" });
}

/** Lowest allowed unit price: material minimum and, if cost is known, cost + minimal markup. */
export function priceFloor(m: MaterialOption, areaM2: number, roundTo: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  const byCost = m.costPerM2 == null ? 0 : roundUp(areaM2 * m.costPerM2 * (1 + cfg.minMarkup), roundTo);
  return Math.max(m.minPrice, byCost);
}

/**
 * ТЗ §3.3, stencil (approved by Денис 2026-10-08: price by area):
 *   unit = max(min, round10(area × rate × complexity)), +5 % if split into several
 *   machine sheets, then ONE best discount (bestLineDiscount), never below priceFloor().
 * Cut length is computed for production (machine time), it does not affect the price.
 */
export function priceStencil(
  sheet: SheetSize, m: MaterialOption, quantity: number, complexity: ComplexityFactor = 1, cfg: PricingConfig = DEFAULT_PRICING,
  buyer?: BuyerContext,
): PriceBreakdown {
  const areaM2 = billingAreaM2(sheet);
  const pieces = piecesFor(sheet, m.maxDimensionsMm);
  const empty = { areaM2, quantity, discounts: [], composite: pieces > 1, pieces };
  if (m.baseSquareMeterPrice == null) return { ...empty, unitPrice: 0, total: 0, priceOnRequest: true };

  let unit = Math.max(m.minPrice, roundUp(areaM2 * m.baseSquareMeterPrice * complexity, cfg.roundStencilTo));
  if (pieces > 1) unit = roundUp(unit * (1 + cfg.compositeSurcharge), cfg.roundStencilTo);

  const d = bestLineDiscount(quantity, areaM2, cfg.stencilTiers, cfg, buyer);
  const discounts: PriceBreakdown["discounts"] = d.value ? [{ label: d.label, percent: Math.round(d.value * 100) }] : [];
  unit = Math.max(priceFloor(m, areaM2, cfg.roundStencilTo, cfg), roundUp(unit * (1 - d.value), cfg.roundStencilTo));
  return { ...empty, discounts, unitPrice: unit, total: unit * quantity, priceOnRequest: false };
}

/** ТЗ §3.3, blank: round1(area × rate) per piece, wholesale tiers, order minimum. */
export function priceBlank(sheet: SheetSize, m: MaterialOption, quantity: number, cfg: PricingConfig = DEFAULT_PRICING, buyer?: BuyerContext): PriceBreakdown & { belowOrderMin: boolean } {
  const areaM2 = billingAreaM2(sheet);
  const empty = { areaM2, quantity, composite: false, pieces: 1 };
  if (m.baseSquareMeterPrice == null) return { ...empty, discounts: [], unitPrice: 0, total: 0, priceOnRequest: true, belowOrderMin: false };
  const w = bestLineDiscount(quantity, 0, cfg.blankTiers, cfg, buyer);
  const qty = w.value;
  const unit = Math.max(priceFloor(m, areaM2, cfg.roundBlankTo, cfg), roundUp(areaM2 * m.baseSquareMeterPrice * (1 - qty), cfg.roundBlankTo));
  const total = unit * quantity;
  return { ...empty, discounts: qty ? [{ label: w.label, percent: Math.round(qty * 100) }] : [], unitPrice: unit, total, priceOnRequest: false, belowOrderMin: total < cfg.blankOrderMin };
}

/** Quick unit price for size chips ("30×20 см · 140 ₴"). */
export function unitPrice(widthCm: number, heightCm: number, m: MaterialOption): number | null {
  if (m.baseSquareMeterPrice == null) return null;
  return priceStencil({ shape: "rect", widthMm: widthCm * 10, heightMm: heightCm * 10 }, m, 1).unitPrice;
}

export const formatUAH = (v: number) => `${v.toLocaleString("uk-UA")} ₴`;

/** Server-side guard: recompute from the state and compare with what the client showed. */
export function verifyClientPrice(state: { materialId: MaterialType; shape: SheetSize["shape"]; widthMm: number; heightMm: number; quantity: number; complexity: ComplexityFactor; metrics: StencilVectorMetrics; calculatedPriceUah: number }, cfg?: PricingConfig): boolean {
  const m = MATERIALS[state.materialId];
  const p = priceStencil({ shape: state.shape, widthMm: state.widthMm, heightMm: state.heightMm }, m, state.quantity, state.complexity, cfg);
  return !p.priceOnRequest && p.total === state.calculatedPriceUah;
}

/* ------------------------------------------------------------------ */
/* Денис's draft API                                                   */
/* ------------------------------------------------------------------ */

export interface StencilPriceResult {
  unitPrice: number;
  totalPrice: number;
  discountPercent: number;
  priceOnRequest: boolean;
}

/** Entry point for the constructor and the server (signature from Денис's draft), price by area. */
export function calculateStencilPrice(
  metrics: StencilVectorMetrics,
  material: MaterialOption,
  quantity = 1,
  complexity: ComplexityFactor = 1,
  cfg: PricingConfig = DEFAULT_PRICING,
  buyer?: BuyerContext,
): StencilPriceResult {
  const p = priceStencil({ shape: "rect", widthMm: metrics.widthMm, heightMm: metrics.heightMm }, material, quantity, complexity, cfg, buyer);
  const discountPercent = Math.round((1 - p.discounts.reduce((k, d) => k * (1 - d.percent / 100), 1)) * 100);
  return { unitPrice: p.unitPrice, totalPrice: p.total, discountPercent, priceOnRequest: p.priceOnRequest };
}

/**
 * Rough cut length of a text for the instant preview before glyphs are measured
 * (Денис's draft). Used for machine time, not for the price. The exact value comes from computeMetrics() on real contours.
 * fontSizeMm = cap height. Returns metres, letters only (no sheet outline).
 */
export function estimateTextPathLength(text: string, fontSizeMm: number): number {
  const chars = [...text].filter((c) => c.trim()).length; // spaces are not cut
  if (!chars) return 0;
  const avgPerimeterPerCharMeters = (fontSizeMm * 3.8) / 1000;
  return Number((chars * avgPerimeterPerCharMeters).toFixed(2));
}

/* ------------------------------------------------------------------ */
/* Cart hints                                                          */
/* ------------------------------------------------------------------ */

export interface TierHint {
  addQty: number;          // pieces to add
  nextDiscount: number;    // 0.05 = −5 %
  progress: number;        // 0..1 towards the next tier
}

/** "Додайте ще 3 шт., щоб отримати −5 %": next quantity tier for one cart line, capped at 15 %. */
export function nextTierHint(quantity: number, tiers: PricingConfig["stencilTiers"] = DEFAULT_PRICING.stencilTiers, cfg: PricingConfig = DEFAULT_PRICING): TierHint | null {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  const next = sorted.find((t) => t.minQty > quantity && Math.min(t.discount, cfg.maxRetailDiscount) > 0);
  if (!next) return null;
  const prev = [...sorted].reverse().find((t) => t.minQty <= quantity)?.minQty ?? 0;
  return { addQty: next.minQty - quantity, nextDiscount: Math.min(next.discount, cfg.maxRetailDiscount), progress: (quantity - prev) / (next.minQty - prev) };
}
