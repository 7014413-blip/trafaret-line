// Laser metrics of a stencil: cut length (machine time, production sheet), billing
// area, pieces. The price does not depend on the cut length (price by area,
// Денис 2026-10-08); the length is for production planning.

import type { MaterialOption, SheetSize, StencilVectorMetrics, VectorDesign } from "../../types/customizer";
import type { StencilCutResult } from "../../types/geometry";
import { billingAreaM2, contourLength, piecesFor, sheetPerimeterMm } from "./geometry";

/** Laser path of the raw design contours plus the sheet outline, mm. */
export function rawCutLengthMm(design: VectorDesign, sheet: SheetSize): number {
  return design.contours.reduce((sum, c) => sum + contourLength(c), 0) + sheetPerimeterMm(sheet);
}

/** Metrics of the final cut (bridges applied) on a sheet. */
export function computeMetrics(cut: StencilCutResult | null, design: VectorDesign, sheet: SheetSize, material: MaterialOption): StencilVectorMetrics {
  const cutLength = cut ? cut.cutLengthMm + sheetPerimeterMm(sheet) : rawCutLengthMm(design, sheet);
  return {
    widthMm: sheet.widthMm,
    heightMm: sheet.heightMm,
    pathLengthMeters: cutLength / 1000,
    areaSquareMeters: billingAreaM2(sheet),
    bridgeCount: cut ? cut.bridges.length : 0,
    isClosedLoopValid: design.contours.every((c) => c.closed),
    pieces: piecesFor(sheet, material.maxDimensionsMm),
  };
}

/**
 * Rough cut length of a text for the instant preview before glyphs are measured
 * (Денис's draft): about 3.8 cap heights of outline per character. Metres, letters only.
 */
export function estimateTextPathLength(text: string, capHeightMm: number): number {
  const chars = [...text].filter((c) => c.trim()).length;
  if (!chars) return 0;
  const perCharMeters = (capHeightMm * 3.8) / 1000;
  return Number((chars * perCharMeters).toFixed(2));
}
