// Price of one pointer sign line. Fixed sizes cost Денис's per-piece price; a custom size
// costs bounding box × sign rate, kept between the fixed sizes it contains and the fixed
// size that contains it, and never below the minimum. Then ONE best discount from the
// site scale (10+ −5 %, 50+ −10 %, 100+ −15 %, or the buyer's own), rounded down, never stacked.
// The server repeats this before the order is accepted.

import type { BuyerContext, Locale } from "../../types/customizer";
import type { PointerPriceLine, PointerSignConfig, PointerSignDesign, PointerSignPrice } from "../../types/pointer-sign";
import { DEFAULT_PRICING, applyDiscount, bestLineDiscount } from "../calculators/pricing";
import { DEFAULT_POINTER_SIGN_CONFIG } from "./config";
import { findPointerMaterial } from "./find-material";
import { resolvePointerSize } from "./size";
import { cmText } from "../format";
import { discountLine, priceLines } from "../i18n/dictionaries/price-lines";

const roundUp = (value: number, step: number) => Math.ceil(value / step - 1e-9) * step;

export function pricePointerSign(
  design: PointerSignDesign, cfg: PointerSignConfig = DEFAULT_POINTER_SIGN_CONFIG, buyer?: BuyerContext, locale: Locale = "uk",
): PointerSignPrice {
  const text = priceLines(locale);
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

  lines.push({ label: text.size(cmText(size.widthMm), cmText(size.heightMm), !size.preset), amount: 0 });
  lines.push({ label: text.pointerBase(base.name[locale].toLowerCase(), base.baseThicknessMm), amount: 0 });
  lines.push({ label: text.pointerText(overlay.name[locale].toLowerCase(), overlay.overlayThicknessMm), amount: 0 });
  if (design.logo) lines.push({ label: text.pointerLogo, amount: 0 });

  const discount = bestLineDiscount(quantity, areaM2, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  const unitPrice = applyDiscount(basePrice, discount.value);
  if (discount.value) lines.push({ label: discountLine(discount.label, discount.value, locale), amount: 0 });

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
