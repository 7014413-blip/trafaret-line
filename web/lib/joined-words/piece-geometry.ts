// Size of one cut piece (letters and the strip under them) at a letter height, mm, with the
// letters' box and the strip inside the piece (origin at the piece's top left, Y down).

import type { JoinedPieceMeasure, JoinedWordsConfig } from "../../types/joined-words";
import { joinedBar } from "./bar";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";

export interface JoinedPieceGeometry {
  widthMm: number;
  heightMm: number;
  /** Layout units → mm. */
  scale: number;
  /** Baseline from the top of the piece, mm. */
  baselineMm: number;
  textX: number;
  bar: { x: number; y: number; width: number; height: number };
}

export function joinedPieceGeometry(
  measure: JoinedPieceMeasure, capMm: number, cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG,
): JoinedPieceGeometry {
  const scale = capMm / Math.max(1e-6, measure.capUnits);
  const bar = joinedBar(capMm, cfg);
  const textWidth = measure.widthUnits * scale;
  const textHeight = measure.heightUnits * scale;
  const baselineMm = measure.baselineUnits * scale;
  const barTop = baselineMm - bar.overlapMm;
  const widthMm = textWidth + 2 * bar.extendMm;
  return {
    widthMm,
    heightMm: Math.max(textHeight, barTop + bar.heightMm),
    scale,
    baselineMm,
    textX: bar.extendMm,
    bar: { x: 0, y: barTop, width: widthMm, height: bar.heightMm },
  };
}
