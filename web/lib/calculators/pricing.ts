// Stencil and blank pricing (ТЗ §3.3, rules of Денис 2026-10-08). Pure functions:
// the browser shows the live price and the Medusa server recomputes the same price
// before the order is accepted, so the customer never sees one price and pays another.
//
//   stencil unit = max(min price, round10(sheet area × rate × complexity))
//                  +5 % when the stencil is split into several machine sheets,
//                  then ONE best discount (never stacked) from that price, rounded down
//                  to 1 ₴, never below the cost floor.
//   blank unit   = max(min price, round1(cutting fee + area × rate)), cutting fee 0 since
//                  Денис chose «only area» on 2026-10-16; then the quantity
//                  discount the same way; order minimum 200 ₴. The fee per piece and the rates
//                  are in data/knowledge_base/materials.json; catalogue blank cards are priced
//                  by the same function (blankUnitPrice), so the card and /zahotovky agree.
// m² is used inside the formula only and never shown to the customer.

import type {
  BuyerContext, ComplexityFactor, MaterialOption, MaterialType, PriceBreakdown, PriceTier, PricingConfig, SheetSize,
  StencilVectorMetrics,
} from "../../types/customizer";
import { MACHINE_SHEET_MM, MATERIALS } from "../materials";
import { billingAreaM2, piecesFor } from "./geometry";
import { squareStencilPrice } from "./square-stencil";

export const DEFAULT_PRICING: PricingConfig = {
  roundStencilTo: 10,
  roundBlankTo: 1,
  blankOrderMin: 200,
  // Денис 2026-10-08: the same scale as stencils.
  blankTiers: [{ minQty: 10, discount: 0.05 }, { minQty: 50, discount: 0.1 }, { minQty: 100, discount: 0.15 }],
  // Admin setting. Денис 2026-10-08: wholesale at most 15 %.
  stencilTiers: [{ minQty: 10, discount: 0.05 }, { minQty: 50, discount: 0.1 }, { minQty: 100, discount: 0.15 }],
  maxWholesaleDiscount: 0.15,
  wholesaleProgram: { enabled: true, discount: 0.2, monthlyThresholdUah: 10_000, graceMonths: 1, singleOrderQualifies: true },
  loyaltyTiers: [
    { minLifetimeUah: 3_000, discount: 0.03 },
    { minLifetimeUah: 7_000, discount: 0.05 },
    { minLifetimeUah: 15_000, discount: 0.07 },
  ],
  firstOrderDiscount: 0.1,
  maxRetailDiscount: 0.15,
  minMarkup: 0.3,
  largeAreaTiers: [{ minM2: 1, discount: 0.1 }, { minM2: 3, discount: 0.15 }],
  machineSheetMm: { width: MACHINE_SHEET_MM.width, height: MACHINE_SHEET_MM.height },
  compositeSurcharge: 0.05,
};

/**
 * Rounds up to the next multiple of step (10 ₴ for stencils, 1 ₴ for blanks). A whole result
 * spoiled by binary fractions (0.01 m² × 2300 = 23.000000000000004) stays whole.
 */
export function roundUp(value: number, step: number): number {
  return Math.ceil(value / step - 1e-9) * step;
}

/** Largest discount among the entries that match. */
export function bestDiscount<T extends { discount: number }>(list: T[], matches: (entry: T) => boolean): number {
  return list.filter(matches).reduce((best, entry) => (entry.discount > best ? entry.discount : best), 0);
}

/**
 * Is the wholesale programme price active for this buyer right now?
 * Approved wholesaler AND (grace period after approval OR previous calendar month paid
 * turnover ≥ threshold OR this order alone ≥ threshold). Otherwise the normal quantity scale.
 */
export function wholesaleProgramActive(buyer: BuyerContext | undefined, cfg: PricingConfig = DEFAULT_PRICING, now = new Date()): boolean {
  const program = cfg.wholesaleProgram;
  if (!program.enabled || !buyer || buyer.wholesaleStatus !== "approved") return false;
  if (buyer.approvedAt) {
    const approved = new Date(buyer.approvedAt);
    const monthsSince = (now.getFullYear() - approved.getFullYear()) * 12 + (now.getMonth() - approved.getMonth());
    if (monthsSince < program.graceMonths) return true;
  }
  if (buyer.previousMonthPaidUah >= program.monthlyThresholdUah) return true;
  return program.singleOrderQualifies && (buyer.currentOrderUah ?? 0) >= program.monthlyThresholdUah;
}

/** Retail loyalty level for lifetime paid orders (server side). */
export function loyaltyFor(lifetimePaidUah: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  return bestDiscount(cfg.loyaltyTiers, (tier) => lifetimePaidUah >= tier.minLifetimeUah);
}

/**
 * Discounts never stack (Денис 2026-10-08): every candidate is computed and the largest
 * one applies. Retail candidates are capped at maxRetailDiscount (15 %); the wholesale
 * programme (20 %) is the only one above it.
 */
export function bestLineDiscount(
  quantity: number, areaM2: number, tiers: PriceTier[], cfg: PricingConfig, buyer?: BuyerContext,
): { value: number; label: string } {
  const cap = (value: number) => Math.min(cfg.maxRetailDiscount, value);
  const candidates: { value: number; label: string }[] = [
    { value: cap(bestDiscount(tiers, (tier) => quantity >= tier.minQty)), label: "Опт за кількість" },
    { value: cap(bestDiscount(cfg.largeAreaTiers, (tier) => areaM2 >= tier.minM2)), label: "Великий формат" },
    { value: cap(buyer?.loyaltyDiscount ?? 0), label: "Постійний клієнт" },
    { value: buyer?.firstOrder ? cap(cfg.firstOrderDiscount) : 0, label: "Перше замовлення" },
    { value: cap(buyer?.promo?.discount ?? 0), label: buyer?.promo?.label ?? `Промокод ${buyer?.promo?.code ?? ""}` },
    { value: wholesaleProgramActive(buyer, cfg) ? cfg.wholesaleProgram.discount : 0, label: "Оптова програма" },
  ];
  return candidates.reduce((best, candidate) => (candidate.value > best.value ? candidate : best), { value: 0, label: "" });
}

/** Lowest allowed unit price before discounts: material minimum and, if cost is known, cost + minimal markup. */
export function priceFloor(material: MaterialOption, areaM2: number, roundTo: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  return Math.max(material.minPrice, costFloor(material, areaM2, roundTo, cfg));
}

/** Lowest unit price a discount may reach: cost + minimal markup (0 when the cost is unknown). */
export function costFloor(material: MaterialOption, areaM2: number, roundTo: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  return material.costPerM2 == null ? 0 : roundUp(areaM2 * material.costPerM2 * (1 + cfg.minMarkup), roundTo);
}

/**
 * Discounted unit price (QA 2026-10-10): the discount applies to the final pre-discount price,
 * minimum price included, and the result is rounded DOWN to whole hryvnias, so the customer
 * always gets at least the promised percent (150 ₴ → 142 / 135 / 127 ₴ for −5 / −10 / −15 %).
 */
export function applyDiscount(unit: number, discount: number): number {
  if (discount <= 0) return unit;
  return Math.floor(unit * (1 - discount) + 1e-9);
}

/**
 * Approved wholesalers buy at the material's wholesale rate (Денис 2026-10-10) instead of the
 * −20 % programme discount; the wholesale rate is final and does not stack with the scale.
 */
export function wholesaleRate(material: MaterialOption, buyer: BuyerContext | undefined, cfg: PricingConfig = DEFAULT_PRICING): number | null {
  if (material.wholesaleSquareMeterPrice == null) return null;
  return buyer?.wholesaleStatus === "approved" && wholesaleProgramActive(buyer, cfg) ? material.wholesaleSquareMeterPrice : null;
}

/** Stencil price for a sheet, see the formula at the top of the file. */
export function priceStencil(
  sheet: SheetSize, material: MaterialOption, quantity: number, complexity: ComplexityFactor = 1, cfg: PricingConfig = DEFAULT_PRICING,
  buyer?: BuyerContext,
): PriceBreakdown {
  const areaM2 = billingAreaM2(sheet);
  const pieces = piecesFor(sheet, material.maxDimensionsMm);
  const common = { areaM2, quantity, composite: pieces > 1, pieces };
  if (material.baseSquareMeterPrice == null) {
    return { ...common, discounts: [], unitPrice: 0, total: 0, priceOnRequest: true };
  }

  const wholesale = wholesaleRate(material, buyer, cfg);
  // Square PET stencils of the listed sizes have Денис's fixed prices (lib/calculators/square-stencil.ts).
  const square = squareStencilPrice(sheet, material.id);
  let unit = square ?? Math.max(material.minPrice, roundUp(areaM2 * (wholesale ?? material.baseSquareMeterPrice) * complexity, cfg.roundStencilTo));
  if (square == null && pieces > 1) unit = roundUp(unit * (1 + cfg.compositeSurcharge), cfg.roundStencilTo);
  if (wholesale != null && square == null) {
    return { ...common, discounts: [{ label: "Оптова ціна", percent: 0 }], unitPrice: unit, total: unit * quantity, priceOnRequest: false };
  }

  const discount = bestLineDiscount(quantity, areaM2, cfg.stencilTiers, cfg, buyer);
  const discounts: PriceBreakdown["discounts"] = discount.value ? [{ label: discount.label, percent: Math.round(discount.value * 100) }] : [];
  unit = Math.max(costFloor(material, areaM2, cfg.roundStencilTo, cfg), applyDiscount(unit, discount.value));
  return { ...common, discounts, unitPrice: unit, total: unit * quantity, priceOnRequest: false };
}

/** Price of one blank before discounts: cutting fee + sheet area × rate (retail or wholesale), rounded up to 1 ₴. */
export function blankUnitPrice(areaM2: number, material: MaterialOption, rate: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  return Math.max(priceFloor(material, areaM2, cfg.roundBlankTo, cfg), roundUp(material.cutFeeUah + areaM2 * rate, cfg.roundBlankTo));
}

/** Blank price (ТЗ §3.3): blankUnitPrice per piece, quantity tiers, order minimum. */
export function priceBlank(
  sheet: SheetSize, material: MaterialOption, quantity: number, cfg: PricingConfig = DEFAULT_PRICING, buyer?: BuyerContext,
): PriceBreakdown & { belowOrderMin: boolean } {
  const areaM2 = billingAreaM2(sheet);
  const common = { areaM2, quantity, composite: false, pieces: 1 };
  if (material.baseSquareMeterPrice == null) {
    return { ...common, discounts: [], unitPrice: 0, total: 0, priceOnRequest: true, belowOrderMin: false };
  }
  const wholesale = wholesaleRate(material, buyer, cfg);
  if (wholesale != null) {
    const unitWholesale = blankUnitPrice(areaM2, material, wholesale, cfg);
    const totalWholesale = unitWholesale * quantity;
    return {
      ...common, discounts: [{ label: "Оптова ціна", percent: 0 }], unitPrice: unitWholesale, total: totalWholesale,
      priceOnRequest: false, belowOrderMin: totalWholesale < cfg.blankOrderMin,
    };
  }
  const discount = bestLineDiscount(quantity, 0, cfg.blankTiers, cfg, buyer);
  const fullUnit = blankUnitPrice(areaM2, material, material.baseSquareMeterPrice, cfg);
  const unit = Math.max(costFloor(material, areaM2, cfg.roundBlankTo, cfg), applyDiscount(fullUnit, discount.value));
  const total = unit * quantity;
  return {
    ...common,
    discounts: discount.value ? [{ label: discount.label, percent: Math.round(discount.value * 100) }] : [],
    unitPrice: unit,
    total,
    priceOnRequest: false,
    belowOrderMin: total < cfg.blankOrderMin,
  };
}

/**
 * Welded words and toppers (one solid piece of acrylic or mirror plastic). Same area
 * formula as a stencil on the bounding box of the piece plus a 5 mm cutting margin,
 * complexity 1.2 for the long outline, minimum 150 ₴. Default set on 2026-10-09, recorded in ТЗ §19.
 */
export const WELD_PRICING = { complexity: 1.2 as ComplexityFactor, minPrice: 150, marginMm: 5 };

export function priceWelded(
  widthMm: number, heightMm: number, material: MaterialOption, quantity: number, cfg: PricingConfig = DEFAULT_PRICING, buyer?: BuyerContext,
): PriceBreakdown {
  const sheet: SheetSize = { shape: "rect", widthMm: widthMm + 2 * WELD_PRICING.marginMm, heightMm: heightMm + 2 * WELD_PRICING.marginMm };
  const priced: MaterialOption = { ...material, minPrice: Math.max(material.minPrice, WELD_PRICING.minPrice) };
  return priceStencil(sheet, priced, quantity, WELD_PRICING.complexity, cfg, buyer);
}

/**
 * Ready catalogue product: the variant price from Medusa (1 piece) with the same quantity
 * scale as stencils (10+ −5 %, 50+ −10 %, 100+ −15 %), rounded down to whole hryvnias.
 */
export function priceCatalogVariant(basePrice: number, quantity: number, cfg: PricingConfig = DEFAULT_PRICING, buyer?: BuyerContext): number {
  const discount = bestLineDiscount(quantity, 0, cfg.stencilTiers, cfg, buyer);
  return Math.max(0, applyDiscount(basePrice, discount.value));
}

/** Quick unit price for size chips ("30×20 см · 140 ₴"). null = price on request. */
export function unitPrice(widthCm: number, heightCm: number, material: MaterialOption): number | null {
  if (material.baseSquareMeterPrice == null) return null;
  return priceStencil({ shape: "rect", widthMm: widthCm * 10, heightMm: heightCm * 10 }, material, 1).unitPrice;
}

/** Server-side guard: recompute from the state and compare with what the client showed. */
export function verifyClientPrice(
  state: {
    materialId: MaterialType; shape: SheetSize["shape"]; widthMm: number; heightMm: number; quantity: number;
    complexity: ComplexityFactor; calculatedPriceUah: number;
  },
  cfg: PricingConfig = DEFAULT_PRICING,
): boolean {
  const material = MATERIALS[state.materialId];
  const price = priceStencil({ shape: state.shape, widthMm: state.widthMm, heightMm: state.heightMm }, material, state.quantity, state.complexity, cfg);
  return !price.priceOnRequest && price.total === state.calculatedPriceUah;
}

export interface StencilPriceResult {
  unitPrice: number;
  totalPrice: number;
  discountPercent: number;
  priceOnRequest: boolean;
}

/** Entry point with the signature of Денис's draft: price by the sheet size in the metrics. */
export function calculateStencilPrice(
  metrics: StencilVectorMetrics,
  material: MaterialOption,
  quantity = 1,
  complexity: ComplexityFactor = 1,
  cfg: PricingConfig = DEFAULT_PRICING,
  buyer?: BuyerContext,
): StencilPriceResult {
  const price = priceStencil({ shape: "rect", widthMm: metrics.widthMm, heightMm: metrics.heightMm }, material, quantity, complexity, cfg, buyer);
  const kept = price.discounts.reduce((k, d) => k * (1 - d.percent / 100), 1);
  return { unitPrice: price.unitPrice, totalPrice: price.total, discountPercent: Math.round((1 - kept) * 100), priceOnRequest: price.priceOnRequest };
}

export interface TierHint {
  /** Pieces to add. */
  addQty: number;
  /** 0.05 = −5 %. */
  nextDiscount: number;
  /** 0..1 towards the next tier. */
  progress: number;
}

/** "Додайте ще 3 шт., щоб отримати −5 %": next quantity tier for one cart line, capped at 15 %. */
export function nextTierHint(quantity: number, tiers: PriceTier[] = DEFAULT_PRICING.stencilTiers, cfg: PricingConfig = DEFAULT_PRICING): TierHint | null {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  const next = sorted.find((tier) => tier.minQty > quantity && Math.min(tier.discount, cfg.maxRetailDiscount) > 0);
  if (!next) return null;
  const previous = [...sorted].reverse().find((tier) => tier.minQty <= quantity)?.minQty ?? 0;
  return {
    addQty: next.minQty - quantity,
    nextDiscount: Math.min(next.discount, cfg.maxRetailDiscount),
    progress: (quantity - previous) / (next.minQty - previous),
  };
}
