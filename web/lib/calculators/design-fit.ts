// Where the design of a «Свій напис» stencil sits on its sheet: the usual sheet is as wide as
// asked and as tall as the text needs; a square sheet (Денис 2026-10-10, square PET stencils)
// is fixed, so the design is scaled to fit inside the margins and centred.

import type { VectorDesign } from "../../types/customizer";

export interface DesignPlacement {
  /** Layout units → mm. */
  scale: number;
  dx: number;
  dy: number;
}

export function designPlacement(design: VectorDesign, widthMm: number, marginMm: number, square: boolean): DesignPlacement {
  const inner = Math.max(1, widthMm - 2 * marginMm);
  const w = Math.max(1, design.bboxMm.w);
  const h = Math.max(1, design.bboxMm.h);
  if (!square) return { scale: inner / w, dx: marginMm, dy: marginMm };
  const scale = Math.min(inner / w, inner / h);
  return { scale, dx: (widthMm - w * scale) / 2, dy: (widthMm - h * scale) / 2 };
}
