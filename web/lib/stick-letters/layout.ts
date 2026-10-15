// Places a set of self-adhesive letters as it is glued: lines one under another, centred, each
// with its letter height (letter height × line size), and the cut pieces of every line. The
// cardboard stencil is the set with a margin around it. mm, origin at the top left of the set, Y down.

import type { StickLettersConfig, StickLettersDesign, StickLettersLayout, StickLettersPiece, StickLineMeasure, StickLinePlacement } from "../../types/stick-letters";
import { DEFAULT_STICK_LETTERS_CONFIG } from "./config";
import { groupStickPieces } from "./group-pieces";

/** Relative letter size of a line, kept inside 0.4 … 1.6. */
export const stickLineSize = (size: number) => Math.min(1.6, Math.max(0.4, Number.isFinite(size) ? size : 1));

export function computeStickLettersLayout(
  design: Pick<StickLettersDesign, "lines" | "letterHeightMm">, measures: (StickLineMeasure | null)[],
  cfg: StickLettersConfig = DEFAULT_STICK_LETTERS_CONFIG,
): StickLettersLayout {
  const rows: { index: number; m: StickLineMeasure; capMm: number; scale: number; width: number; height: number }[] = [];
  design.lines.forEach((line, index) => {
    const m = measures[index];
    if (!m) return;
    const capMm = design.letterHeightMm * stickLineSize(line.size);
    const scale = capMm / Math.max(1e-6, m.capUnits);
    rows.push({ index, m, capMm, scale, width: m.widthUnits * scale, height: m.heightUnits * scale });
  });
  const width = Math.max(0, ...rows.map((r) => r.width));
  const lines: StickLinePlacement[] = [];
  const pieces: StickLettersPiece[] = [];
  let y = 0;
  rows.forEach((row, k) => {
    const x = (width - row.width) / 2;
    const joined = design.lines[row.index].joined;
    const groups = groupStickPieces(row.m.glyphs, joined, row.m.capUnits * cfg.touchShare);
    for (const g of groups) {
      pieces.push({
        lineIndex: row.index, text: g.char,
        x: x + g.minX * row.scale, y: y + g.minY * row.scale,
        width: (g.maxX - g.minX) * row.scale, height: (g.maxY - g.minY) * row.scale,
      });
    }
    lines.push({
      index: row.index, x, y, width: row.width, height: row.height, capMm: row.capMm, scale: row.scale,
      apart: joined && row.m.glyphs.length > 1 && groups.length === row.m.glyphs.length,
    });
    y += row.height + (k < rows.length - 1 ? row.capMm * cfg.rowGapShare : 0);
  });
  const m = cfg.stencilMarginMm;
  return { widthMm: width, heightMm: y, lines, pieces, stencil: { x: -m, y: -m, width: width + 2 * m, height: y + 2 * m } };
}
