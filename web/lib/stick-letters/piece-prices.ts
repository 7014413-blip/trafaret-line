// Price of every piece of a set on its own (Денис 2026-10-11: «цена за 1 штуку в м2»): the outer box
// of the piece × the rate per m², whole UAH. Identical pieces (same character, same size) are
// grouped, in the order they first appear. The set price itself stays the sum of all boxes,
// rounded up to 10 UAH (price.ts); this list only shows the customer what each piece costs.

import type { StickLettersConfig, StickLettersLayout, StickPiecePrice } from "../../types/stick-letters";
import { stickRateFor } from "./rate-for";

export function stickPiecePrices(
  layout: StickLettersLayout, adhesive: boolean, materialId: string, cfg: StickLettersConfig,
): StickPiecePrice[] {
  const rate = stickRateFor(cfg, materialId, adhesive);
  const groups = new Map<string, StickPiecePrice>();
  for (const piece of layout.pieces) {
    const widthMm = Math.round(piece.width);
    const heightMm = Math.round(piece.height);
    const key = `${piece.text}|${widthMm}|${heightMm}`;
    const found = groups.get(key);
    if (found) {
      found.count += 1;
    } else {
      groups.set(key, { text: piece.text, widthMm, heightMm, count: 1, price: Math.round((piece.width * piece.height * rate) / 1e6) });
    }
  }
  return [...groups.values()];
}
