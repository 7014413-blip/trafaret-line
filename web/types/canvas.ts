// Free canvas (components/constructor/Canvas2D.tsx): several objects on one stencil
// sheet. Every object keeps its own outline in local millimetres plus a transform,
// so the cut file is rebuilt exactly from the stored state.

import type { Polygon, StencilCutResult, Vec2, WeldResult } from "./geometry";
import type { MaterialType } from "./customizer";

export type CanvasElementKind = "text" | "shape" | "upload";

export type CanvasShapeKind = "circle" | "rect" | "star" | "heart" | "frame";

export interface CanvasTransform {
  /** Left/top of the element bounding box on the sheet, mm. */
  x: number;
  y: number;
  /** Uniform scale of the local outline (1 = as stored). */
  scale: number;
  /** Degrees, clockwise. */
  angle: number;
}

interface CanvasElementBase {
  id: string;
  kind: CanvasElementKind;
  /**
   * Outline in local mm, bounding box starts at (0, 0). One group per glyph or shape:
   * contours inside a group are resolved even-odd (holes), groups are united.
   */
  groups: Polygon[][];
  /** Local size before the transform, mm. */
  widthMm: number;
  heightMm: number;
  transform: CanvasTransform;
  locked: boolean;
}

export interface CanvasTextElement extends CanvasElementBase {
  kind: "text";
  text: string;
  fontId: string;
  /** Cap height in local units (mm at scale 1). */
  capMm: number;
}

export interface CanvasShapeElement extends CanvasElementBase {
  kind: "shape";
  shape: CanvasShapeKind;
}

export interface CanvasUploadElement extends CanvasElementBase {
  kind: "upload";
  fileName: string;
}

export type CanvasElement = CanvasTextElement | CanvasShapeElement | CanvasUploadElement;

export interface CanvasSettings {
  sheetWidthMm: number;
  sheetHeightMm: number;
  /** Safe margin from the sheet edge, mm (15 by default). */
  marginMm: number;
  /** Grid step, mm. */
  gridMm: number;
  snapToGrid: boolean;
  showGrid: boolean;
  materialId: MaterialType;
  /** «Трафарет» (elements are cut out) or «Цілим шматком» (elements are the piece). Missing = stencil. */
  result?: CanvasResultMode;
  /** «З'єднати автоматично» in the piece mode: short connectors join loose parts. */
  autoJoin?: boolean;
}

export type CanvasResultMode = "stencil" | "piece";

export type CanvasIssueKind =
  | "out_of_margin" | "overlap_sheet_edge" | "island_unbridged" | "bridge_long" | "thin_part" | "thin_slot" | "letter_too_small"
  | "pieces_apart";

export interface CanvasIssue {
  kind: CanvasIssueKind;
  level: "error" | "warning";
  /** Element the issue belongs to, when known. */
  elementId?: string;
  at?: Vec2;
  message: string;
}

export interface CanvasAnalysis {
  cut: StencilCutResult;
  issues: CanvasIssue[];
  /** Outlines of elements in sheet coordinates, for hit-testing and export. */
  placed: { elementId: string; groups: Polygon[][] }[];
  /** «Цілим шматком»: the solid piece (cut = its outline); absent in the stencil mode. */
  piece?: WeldResult;
}
