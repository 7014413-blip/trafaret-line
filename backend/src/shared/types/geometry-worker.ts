// Messages between the page and workers/geometry.worker.ts.

import type { CanvasAnalysis, CanvasElement, CanvasSettings } from "./canvas";
import type { PlacedGlyph, Polygon, StencilCutOptions, StencilCutResult, TextAlign, WeldOptions, WeldResult } from "./geometry";

/** Welded word sized to the requested width (lib/geometry/weld-sizing.ts). */
export interface SizedWeld {
  result: WeldResult;
  /** Cap height of the letters, mm. */
  capMm: number;
  /** Layout units → mm. */
  scale: number;
}

export type GeometryRequest =
  | { id: number; type: "stencil"; groups: Polygon[][]; options: StencilCutOptions }
  | { id: number; type: "canvas"; elements: CanvasElement[]; settings: CanvasSettings }
  | { id: number; type: "weld"; glyphs: PlacedGlyph[]; capUnits: number; widthMm: number; align: TextAlign; options: WeldOptions };

export type GeometryResponse =
  | { id: number; type: "stencil"; cut: StencilCutResult }
  | { id: number; type: "canvas"; analysis: CanvasAnalysis }
  | { id: number; type: "weld"; weld: SizedWeld | null }
  | { id: number; type: "error"; message: string };
