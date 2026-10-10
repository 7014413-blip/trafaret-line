// Letter height that makes the widest row of a «Написи на планці» set as long as the customer
// asks. The strip ends do not grow exactly with the letters, so the height is corrected a few
// times; the result is whole millimetres inside the letter limits.

import type { JoinedLineMeasures, JoinedWordsConfig, JoinedWordsDesign } from "../../types/joined-words";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";
import { computeJoinedWordsLayout } from "./layout";

export function letterHeightForWidth(
  design: Pick<JoinedWordsDesign, "lines" | "letterHeightMm">, measures: JoinedLineMeasures[], targetWidthMm: number,
  cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG,
): number | null {
  if (!Number.isFinite(targetWidthMm) || targetWidthMm <= 0) return null;
  let height = Math.max(1, design.letterHeightMm);
  for (let pass = 0; pass < 4; pass++) {
    const width = computeJoinedWordsLayout({ ...design, letterHeightMm: height }, measures, cfg).widthMm;
    if (width <= 0) return null;
    height *= targetWidthMm / width;
  }
  return Math.min(cfg.maxLetterMm, Math.max(cfg.minLetterMm, Math.round(height)));
}
