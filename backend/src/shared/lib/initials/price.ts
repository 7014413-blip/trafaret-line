// Price of one wedding initials set: 8200 UAH per m² of the whole composition's box (Денис
// 2026-10-10), rounded up to 10 UAH, never below the minimum; then ONE best discount from the
// site scale by quantity, rounded down. The customer sees centimetres only. Repeated on the server.

import type { BuyerContext } from "../../types/customizer";
import type { InitialsConfig, InitialsDesign, InitialsLayout, InitialsPrice } from "../../types/initials";
import { DEFAULT_PRICING, applyDiscount, bestLineDiscount } from "../calculators/pricing";
import { findJoinedWordsMaterial } from "../joined-words/find-material";
import { pluralUk } from "../text/plural-uk";
import { DEFAULT_INITIALS_CONFIG } from "./config";

const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

export function initialsBasePrice(layout: InitialsLayout, cfg: InitialsConfig = DEFAULT_INITIALS_CONFIG): number {
  const areaM2 = (layout.widthMm * layout.heightMm) / 1e6;
  return Math.max(cfg.minPrice, Math.ceil((areaM2 * cfg.ratePerM2) / cfg.roundTo - 1e-9) * cfg.roundTo);
}

export function priceInitials(
  design: InitialsDesign, layout: InitialsLayout, cfg: InitialsConfig = DEFAULT_INITIALS_CONFIG, buyer?: BuyerContext,
): InitialsPrice {
  const quantity = Math.max(1, Math.round(design.quantity));
  const sheet = findJoinedWordsMaterial(design.materialId);
  const basePrice = initialsBasePrice(layout, cfg);
  const discount = bestLineDiscount(quantity, 0, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  const unitPrice = applyDiscount(basePrice, discount.value);
  const lines = [
    `Уся композиція ${cm(layout.widthMm)} × ${cm(layout.heightMm)} см, літери ${cm(design.letterHeightMm)} см`,
    design.mode === "topper" ? "Одним топпером на планці зі шпажкою" : `${layout.pieces} ${pluralUk(layout.pieces, ["деталь", "деталі", "деталей"])}, кладуться на торт`,
    `${sheet.name.uk}, ${sheet.thicknessMm} мм`,
  ];
  if (discount.value) lines.push(`${discount.label}: −${Math.round(discount.value * 100)}%`);
  return {
    unitPrice, total: unitPrice * quantity, quantity, lines,
    internal: { areaCm2: (layout.widthMm * layout.heightMm) / 100, basePrice, discountPercent: Math.round(discount.value * 100), discountLabel: discount.label },
  };
}
