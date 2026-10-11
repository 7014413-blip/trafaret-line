// Price of one set of self-adhesive letters: the product's rate per m² of the cut pieces, each piece
// by its outer box (letters 7000, chars 7500 with tape or 6500 without, sign-letters 6500 black or
// white and 10 200 mirror, Денис), the stencil included, rounded up to 10 UAH, never below
// the minimum; then ONE best discount from the site scale (10+ −5 %, 50+ −10 %, 100+ −15 %, or the
// buyer's own), rounded down. The customer sees pieces and centimetres, never m². Repeated on the server.

import type { BuyerContext } from "../../types/customizer";
import type { StickLettersConfig, StickLettersDesign, StickLettersLayout, StickLettersPrice } from "../../types/stick-letters";
import { DEFAULT_PRICING, applyDiscount, bestLineDiscount } from "../calculators/pricing";
import { findJoinedWordsMaterial } from "../joined-words/find-material";
import { pluralUk } from "../text/plural-uk";
import { DEFAULT_STICK_LETTERS_CONFIG } from "./config";
import { stickRateFor } from "./rate-for";

const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

/** Price of one set before discounts. */
export function stickLettersBasePrice(
  layout: StickLettersLayout, adhesive: boolean, materialId: string, cfg: StickLettersConfig = DEFAULT_STICK_LETTERS_CONFIG,
): number {
  const areaM2 = layout.pieces.reduce((sum, p) => sum + (p.width * p.height) / 1e6, 0);
  const rate = stickRateFor(cfg, materialId, adhesive);
  return Math.max(cfg.minPrice, Math.ceil((areaM2 * rate) / cfg.roundTo - 1e-9) * cfg.roundTo);
}

export function priceStickLetters(
  design: StickLettersDesign, layout: StickLettersLayout, cfg: StickLettersConfig = DEFAULT_STICK_LETTERS_CONFIG, buyer?: BuyerContext,
): StickLettersPrice {
  const quantity = Math.max(1, Math.round(design.quantity));
  const sheet = findJoinedWordsMaterial(design.materialId);
  const areaCm2 = layout.pieces.reduce((sum, p) => sum + (p.width * p.height) / 100, 0);
  const adhesive = design.adhesive || cfg.rateNoAdhesivePerM2 == null;
  const basePrice = stickLettersBasePrice(layout, adhesive, design.materialId, cfg);
  // Many small pieces, not a large sheet: the large-format discount does not apply.
  const discount = bestLineDiscount(quantity, 0, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  const unitPrice = applyDiscount(basePrice, discount.value);
  const count = layout.pieces.length;
  const lines = [
    `${count} ${pluralUk(count, ["деталь", "деталі", "деталей"])}, увесь напис ${cm(layout.widthMm)} × ${cm(layout.heightMm)} см`,
    `${sheet.name.uk}, ${cfg.thicknessMm} мм, ${adhesive ? "самоклейка на звороті" : "без самоклейки"}`,
  ];
  if (cfg.stencil) lines.push("Картонний трафарет для рівної поклейки, у ціні");
  if (discount.value) lines.push(`${discount.label}: −${Math.round(discount.value * 100)}%`);
  return {
    unitPrice, total: unitPrice * quantity, quantity, lines,
    internal: { areaCm2, basePrice, pieces: count, discountPercent: Math.round(discount.value * 100), discountLabel: discount.label },
  };
}
