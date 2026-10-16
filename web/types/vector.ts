// Vector files for the laser (lib/export/layers.ts) and the geometry they are built from.
// Contours are in sheet millimetres; the export writes SVG and DXF with one colour per layer
// (RDWorks / Ruida assigns cut settings per colour).

import type { Polygon, Vec2 } from "./geometry";
import type { SheetSize } from "./customizer";

export type { BBox, Polygon, Vec2 } from "./geometry";
export type { Contour, StencilVectorMetrics, VectorDesign } from "./customizer";

/** Open or closed line of points, mm. */
export interface Polyline {
  points: Vec2[];
  closed: boolean;
}

/** Machine layers: inner cuts, outer outline, holes and marks, positioning template. */
export type LayerId = "CUT_INNER" | "CUT_OUTER" | "MARKS" | "TEMPLATE";

/** Colour of a layer: AutoCAD Color Index in DXF, RGB in SVG; order = cutting order. */
export interface LayerStyle {
  aci: number;
  rgb: string;
  order: number;
}

/** Round hole on the MARKS layer. */
export interface Hole {
  /** Centre, mm from the sheet's top-left corner. */
  x: number;
  y: number;
  diameterMm: number;
}

/** One production part: everything the export turns into one SVG and one DXF. */
export interface LayeredPart {
  sheet: SheetSize;
  /** Final cut regions in sheet mm (StencilCutResult.cutPaths or WeldResult.shapes). */
  cutPaths: ReadonlyArray<Polygon>;
  holes?: Hole[];
  /** Positioning template contours (signs), optional. */
  template?: ReadonlyArray<Polygon>;
  /** Order number etc., written into SVG metadata and the DXF header comment. */
  label?: string;
}
