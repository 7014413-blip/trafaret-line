// Price of one set of two-layer plaques: the plaque price (lib/layered-plaque/base-price.ts)
// times the plaques in the set; ONE best discount from the site scale by all plaques ordered
// (10+ −5 %, 50+ −10 %, 100+ −15 %, or the buyer's own), rounded down per plaque.
// Repeated on the server.

import type { BuyerContext } from "../../types/customizer";
import type { LayeredPlaqueConfig, LayeredPlaqueDesign, LayeredPlaquePrice } from "../../types/layered-plaque";
import { DEFAULT_PRICING, applyDiscount, bestLineDiscount } from "../calculators/pricing";
import { pluralUk } from "../text/plural-uk";
import { layeredPlaqueBasePrice } from "./base-price";
import { findLayeredPlaqueMaterial } from "./materials";
import { plaquesInSet } from "./series";
import { resolveLayeredPlaqueSize } from "./size";
import { cmText } from "../format";

export function priceLayeredPlaque(design: LayeredPlaqueDesign, cfg: LayeredPlaqueConfig, buyer?: BuyerContext): LayeredPlaquePrice {
  const size = resolveLayeredPlaqueSize(design, cfg);
  const quantity = Math.max(1, Math.round(design.quantity));
  const count = plaquesInSet(design.series);
  const base = findLayeredPlaqueMaterial(design.baseMaterialId);
  const overlay = findLayeredPlaqueMaterial(design.overlayMaterialId);
  const basePrice = layeredPlaqueBasePrice(size.widthMm, size.heightMm, cfg);
  const discount = bestLineDiscount(count * quantity, 0, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  const piecePrice = applyDiscount(basePrice, discount.value);
  const unitPrice = piecePrice * count;
  const lines = [`Розмір ${cmText(size.widthMm)} × ${cmText(size.heightMm)} см${size.preset ? "" : " (свій)"}`];
  if (cfg.kind === "number") lines.push(`Лицьовий шар ${base.name.uk.toLowerCase()}, нижній ${overlay.name.uk.toLowerCase()}, клейова основа`);
  else lines.push(`Основа ${base.name.uk.toLowerCase()}, напис${design.frame ? " і рамка" : ""}: ${overlay.name.uk.toLowerCase()}`);
  if (design.series) lines.push(`Номери ${design.series.from}–${design.series.to}: ${count} ${pluralUk(count, ["табличка", "таблички", "табличок"])} по ${piecePrice} ₴`);
  if (discount.value) lines.push(`${discount.label}: −${Math.round(discount.value * 100)}%`);
  return {
    unitPrice, total: unitPrice * quantity, quantity, count, piecePrice, lines,
    internal: { basePrice, discountPercent: Math.round(discount.value * 100), discountLabel: discount.label },
  };
}
