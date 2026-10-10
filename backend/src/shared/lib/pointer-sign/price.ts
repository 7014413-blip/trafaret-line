// Price of one pointer sign line. Fixed sizes cost Денис's per-piece price; a custom size
// costs bounding box × sign rate, kept between the fixed sizes it contains and the fixed
// size that contains it, and never below the minimum. Then ONE best discount from the
// site scale (10+ −5 %, 50+ −10 %, 100+ −15 %, or the buyer's own), rounded down, never stacked.
// The server repeats this before the order is accepted.

import type { BuyerContext } from "../../types/customizer";
import type { PointerPriceLine, PointerSignConfig, PointerSignDesign, PointerSignPrice } from "../../types/pointer-sign";
import { DEFAULT_PRICING, applyDiscount, bestLineDiscount } from "../calculators/pricing";
import { DEFAULT_POINTER_SIGN_CONFIG } from "./config";
import { findPointerMaterial } from "./find-material";
import { resolvePointerSize } from "./size";

const roundUp = (value: number, step: number) => Math.ceil(value / step - 1e-9) * step;
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

export function pricePointerSign(
  design: PointerSignDesign, cfg: PointerSignConfig = DEFAULT_POINTER_SIGN_CONFIG, buyer?: BuyerContext,
): PointerSignPrice {
  const size = resolvePointerSize(design, cfg);
  const quantity = Math.max(1, Math.round(design.quantity));
  const areaM2 = (size.widthMm * size.heightMm) / 1e6;
  const base = findPointerMaterial(design.baseMaterialId);
  const overlay = findPointerMaterial(design.overlayMaterialId);
  const lines: PointerPriceLine[] = [];

  let basePrice: number;
  if (size.preset) {
    basePrice = size.preset.price;
  } else {
    const byRate = areaM2 * cfg.customRatePerM2;
    const contained = cfg.presets.filter((p) => p.widthMm <= size.widthMm && p.heightMm <= size.heightMm).map((p) => p.price);
    const containing = cfg.presets.filter((p) => p.widthMm >= size.widthMm && p.heightMm >= size.heightMm).map((p) => p.price);
    const floor = Math.max(cfg.minPrice, ...contained);
    const ceiling = containing.length ? Math.min(...containing) : Number.POSITIVE_INFINITY;
    basePrice = roundUp(Math.min(Math.max(byRate, floor), ceiling), cfg.roundTo);
  }

  lines.push({ label: `Розмір ${cm(size.widthMm)} × ${cm(size.heightMm)} см${size.preset ? "" : " (свій)"}`, amount: 0 });
  lines.push({ label: `Основа: ${base.name.uk.toLowerCase()} ${base.baseThicknessMm} мм`, amount: 0 });
  lines.push({ label: `Напис: ${overlay.name.uk.toLowerCase()} ${overlay.overlayThicknessMm} мм, усі кольори вже в ціні`, amount: 0 });
  if (design.logo) lines.push({ label: "Логотип: без доплати, макет погодимо перед порізкою", amount: 0 });

  const discount = bestLineDiscount(quantity, areaM2, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  const unitPrice = applyDiscount(basePrice, discount.value);
  if (discount.value) lines.push({ label: `${discount.label}: −${Math.round(discount.value * 100)}%`, amount: 0 });

  return {
    unitPrice,
    total: unitPrice * quantity,
    quantity,
    lines,
    needsManager: !base.inStock || !overlay.inStock,
    internal: {
      areaM2, preset: size.preset?.code ?? null, basePrice,
      discountPercent: Math.round(discount.value * 100), discountLabel: discount.label,
    },
  };
}
