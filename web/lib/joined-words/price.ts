// Price of one «Написи на планці» set: 7000 UAH per m² of the cut pieces, each piece by its outer
// box (Денис 2026-10-10), rounded up to 10 UAH, never below the minimum; then ONE best discount
// from the site scale (10+ −5 %, 50+ −10 %, 100+ −15 %, or the buyer's own), rounded down.
// The customer sees pieces and centimetres, never m². Repeated on the server.

import type { BuyerContext, Locale } from "../../types/customizer";
import type { JoinedWordsConfig, JoinedWordsDesign, JoinedWordsLayout, JoinedWordsPrice } from "../../types/joined-words";
import { DEFAULT_PRICING, applyDiscount, bestLineDiscount } from "../calculators/pricing";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";
import { findJoinedWordsMaterial } from "./find-material";
import { cmText } from "../format";
import { decimal, units } from "../i18n/dictionaries/units";
import { discountLine, priceLines } from "../i18n/dictionaries/price-lines";

/** Price of one set before discounts. */
export function joinedWordsBasePrice(layout: JoinedWordsLayout, cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG): number {
  const areaM2 = layout.pieces.reduce((sum, p) => sum + (p.widthMm * p.heightMm) / 1e6, 0);
  return Math.max(cfg.minPrice, Math.ceil((areaM2 * cfg.ratePerM2) / cfg.roundTo - 1e-9) * cfg.roundTo);
}

export function priceJoinedWords(
  design: JoinedWordsDesign, layout: JoinedWordsLayout, cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG, buyer?: BuyerContext, locale: Locale = "uk",
): JoinedWordsPrice {
  const text = priceLines(locale);
  const quantity = Math.max(1, Math.round(design.quantity));
  const sheet = findJoinedWordsMaterial(design.materialId);
  const areaCm2 = layout.pieces.reduce((sum, p) => sum + (p.widthMm * p.heightMm) / 100, 0);
  const basePrice = joinedWordsBasePrice(layout, cfg);
  // Many small pieces, not a large sheet: the large-format discount does not apply.
  const discount = bestLineDiscount(quantity, 0, DEFAULT_PRICING.stencilTiers, DEFAULT_PRICING, buyer);
  const unitPrice = applyDiscount(basePrice, discount.value);
  const longest = layout.pieces.reduce((max, p) => Math.max(max, p.widthMm), 0);
  const rows = new Set(layout.pieces.map((p) => p.lineIndex)).size;
  const lines = [
    `${text.rows(rows)}, ${text.pieces(layout.pieces.length)}`,
    text.wordsLongest(cmText(longest, locale), cmText(layout.widthMm, locale), cmText(layout.heightMm, locale)),
    `${sheet.name[locale]}, ${decimal(sheet.thicknessMm, locale)} ${units(locale).mm}`,
  ];
  if (discount.value) lines.push(discountLine(discount.label, discount.value, locale));
  return {
    unitPrice, total: unitPrice * quantity, quantity, lines,
    internal: { areaCm2, basePrice, pieces: layout.pieces.length, discountPercent: Math.round(discount.value * 100), discountLabel: discount.label },
  };
}
