// Price of one set of two-layer plaques: the plaque price (lib/layered-plaque/base-price.ts)
// times the plaques in the set; ONE best discount from the site scale by all plaques ordered
// (10+ −5 %, 50+ −10 %, 100+ −15 %, or the buyer's own), rounded down per plaque.
// Repeated on the server.

import type { BuyerContext, Locale } from "../../types/customizer";
import type { LayeredPlaqueConfig, LayeredPlaqueDesign, LayeredPlaquePrice } from "../../types/layered-plaque";
import { DEFAULT_PRICING, applyDiscount, bestLineDiscount } from "../calculators/pricing";
import { layeredPlaqueBasePrice } from "./base-price";
import { findLayeredPlaqueMaterial } from "./materials";
import { plaquesInSet } from "./series";
import { resolveLayeredPlaqueSize } from "./size";
import { cmText } from "../format";
import { discountLine, priceLines } from "../i18n/dictionaries/price-lines";

export function priceLayeredPlaque(design: LayeredPlaqueDesign, cfg: LayeredPlaqueConfig, buyer?: BuyerContext, locale: Locale = "uk"): LayeredPlaquePrice {
  const text = priceLines(locale);
  const size = resolveLayeredPlaqueSize(design, cfg);
  const quantity = Math.max(1, Math.round(design.quantity));
  const count = plaquesInSet(design.series);
  const base = findLayeredPlaqueMaterial(design.baseMaterialId);
  const overlay = findLayeredPlaqueMaterial(design.overlayMaterialId);
  const basePrice = layeredPlaqueBasePrice(size.widthMm, size.heightMm, cfg);
  const discount = bestLineDiscount(count * quantity, 0, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  const piecePrice = applyDiscount(basePrice, discount.value);
  const unitPrice = piecePrice * count;
  const lines = [text.size(cmText(size.widthMm, locale), cmText(size.heightMm, locale), !size.preset)];
  if (cfg.kind === "number") lines.push(text.numberLayers(base.name[locale].toLowerCase(), overlay.name[locale].toLowerCase()));
  else lines.push(text.plaqueLayers(base.name[locale].toLowerCase(), !!design.frame, overlay.name[locale].toLowerCase()));
  if (design.series) lines.push(text.plaqueSeries(design.series.from, design.series.to, text.plaques(count), piecePrice));
  if (discount.value) lines.push(discountLine(discount.label, discount.value, locale));
  return {
    unitPrice, total: unitPrice * quantity, quantity, count, piecePrice, lines,
    internal: { basePrice, discountPercent: Math.round(discount.value * 100), discountLabel: discount.label },
  };
}
