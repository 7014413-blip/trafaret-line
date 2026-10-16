// Price of a configured blank: the blank formula of lib/calculators/pricing.ts on the sheet of
// the shape, at the chosen quantity, for one pack and for every step of the wholesale scale.
// Runs in the browser and again on the server at checkout.

import type { BlankDesign, BlankPrice } from "../../types/blank";
import type { BuyerContext, PricingConfig } from "../../types/customizer";
import { DEFAULT_PRICING, priceBlank } from "../calculators/pricing";
import { MATERIALS } from "../materials";
import { blankShape } from "./shapes";
import { blankSheet } from "./size";

/** Pieces in one pack of blanks (Claude default 2026-10-16: the first step of the scale). */
export const BLANK_PACK_QTY = 10;

export function priceBlankDesign(design: BlankDesign, cfg: PricingConfig = DEFAULT_PRICING, buyer?: BuyerContext): BlankPrice {
  const material = MATERIALS[design.materialId];
  const sheet = blankSheet(blankShape(design.shapeId), design.widthMm, design.heightMm);
  const at = (quantity: number) => priceBlank(sheet, material, quantity, cfg, buyer);
  const chosen = at(design.quantity);
  if (chosen.priceOnRequest) throw new Error(`blank sheet ${design.materialId} has no price`);
  const pack = at(BLANK_PACK_QTY);
  const steps = [1, ...cfg.blankTiers.map((tier) => tier.minQty)].sort((a, b) => a - b);
  return {
    unitPrice: chosen.unitPrice,
    total: chosen.total,
    discount: (chosen.discounts[0]?.percent ?? 0) / 100,
    packQty: BLANK_PACK_QTY,
    packPrice: pack.total,
    tiers: steps.map((minQty) => {
      const step = at(minQty);
      return { minQty, discount: (step.discounts[0]?.percent ?? 0) / 100, unitPrice: step.unitPrice };
    }),
  };
}
