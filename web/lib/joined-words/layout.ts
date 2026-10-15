// Places the pieces of a «Написи на планці» set as they hang on the wall: one row per line,
// the words first and their price to the right, rows left aligned, the pieces of a row on one
// baseline. mm, origin at the top left of the set, Y down.

import type { JoinedLineMeasures, JoinedWordsConfig, JoinedWordsDesign, JoinedWordsLayout, JoinedWordsPiece } from "../../types/joined-words";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";
import { joinedPieceGeometry, type JoinedPieceGeometry } from "./piece-geometry";

/** Relative letter size of a line, kept inside 0.6 … 1.6. */
export const lineSize = (size: number) => Math.min(1.6, Math.max(0.6, Number.isFinite(size) ? size : 1));

export function computeJoinedWordsLayout(
  design: Pick<JoinedWordsDesign, "lines" | "letterHeightMm">, measures: JoinedLineMeasures[],
  cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG,
): JoinedWordsLayout {
  const pieces: JoinedWordsPiece[] = [];
  let top = 0;
  let width = 0;
  let bottom = 0;
  design.lines.forEach((line, lineIndex) => {
    const m = measures[lineIndex];
    if (!m || (!m.text && !m.tail)) return;
    const capMm = design.letterHeightMm * lineSize(line.size);
    const parts: { part: "text" | "tail"; g: JoinedPieceGeometry; x: number }[] = [];
    let x = 0;
    for (const part of ["text", "tail"] as const) {
      const measure = m[part];
      if (!measure) continue;
      const g = joinedPieceGeometry(measure, capMm, cfg);
      parts.push({ part, g, x });
      x += g.widthMm + capMm * cfg.tailGapShare;
    }
    const baseline = top + Math.max(...parts.map((p) => p.g.baselineMm));
    let rowBottom = top;
    for (const { part, g, x: px } of parts) {
      const y = baseline - g.baselineMm;
      pieces.push({
        lineIndex, part, x: px, y, widthMm: g.widthMm, heightMm: g.heightMm, capMm, scale: g.scale,
        textX: px + g.textX, textY: y,
        bar: { x: px + g.bar.x, y: y + g.bar.y, width: g.bar.width, height: g.bar.height },
      });
      rowBottom = Math.max(rowBottom, y + g.heightMm);
      width = Math.max(width, px + g.widthMm);
    }
    bottom = rowBottom;
    top = rowBottom + capMm * cfg.rowGapShare;
  });
  return { widthMm: width, heightMm: bottom, pieces };
}
