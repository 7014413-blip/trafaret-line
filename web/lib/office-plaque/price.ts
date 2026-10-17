// Price of one office plaque line: the reference price (21×6 cm, 220 UAH) scaled by area,
// rounded up to 10 UAH, never below the minimum; then ONE best discount from the site scale
// (10+ −5 %, 50+ −10 %, 100+ −15 %, or the buyer's own), rounded down. Repeated on the server.

import type { BuyerContext, Locale } from "../../types/customizer";
import type { OfficePlaqueConfig, OfficePlaqueDesign, OfficePlaquePrice } from "../../types/office-plaque";
import { DEFAULT_PRICING, applyDiscount, bestLineDiscount } from "../calculators/pricing";
import { findPlaqueBase, findPlaquePlate } from "./colours";
import { DEFAULT_OFFICE_PLAQUE_CONFIG } from "./config";
import { resolvePlaqueSize } from "./size";
import { cmText } from "../format";
import { discountLine, priceLines } from "../i18n/dictionaries/price-lines";

/** Price of one plaque of this size before discounts. */
export function plaqueBasePrice(widthMm: number, heightMm: number, cfg: OfficePlaqueConfig = DEFAULT_OFFICE_PLAQUE_CONFIG): number {
  const byArea = (cfg.referencePrice * widthMm * heightMm) / (cfg.referenceWidthMm * cfg.referenceHeightMm);
  return Math.max(cfg.minPrice, Math.ceil(byArea / cfg.roundTo - 1e-9) * cfg.roundTo);
}

export function priceOfficePlaque(
  design: OfficePlaqueDesign, cfg: OfficePlaqueConfig = DEFAULT_OFFICE_PLAQUE_CONFIG, buyer?: BuyerContext, locale: Locale = "uk",
): OfficePlaquePrice {
  const text = priceLines(locale);
  const size = resolvePlaqueSize(design, cfg);
  const quantity = Math.max(1, Math.round(design.quantity));
  const base = findPlaqueBase(design.baseColourId);
  const plate = findPlaquePlate(design.plateColourId);
  const basePrice = plaqueBasePrice(size.widthMm, size.heightMm, cfg);
  const discount = bestLineDiscount(quantity, (size.widthMm * size.heightMm) / 1e6, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  const unitPrice = applyDiscount(basePrice, discount.value);
  const lines = [
    text.size(cmText(size.widthMm, locale), cmText(size.heightMm, locale), !size.preset),
    text.officeLayers(base.name[locale].toLowerCase(), plate.name[locale].toLowerCase()),
    text.office3m,
  ];
  if (discount.value) lines.push(discountLine(discount.label, discount.value, locale));
  return {
    unitPrice, total: unitPrice * quantity, quantity, lines,
    internal: { areaCm2: (size.widthMm * size.heightMm) / 100, basePrice, discountPercent: Math.round(discount.value * 100), discountLabel: discount.label },
  };
}
