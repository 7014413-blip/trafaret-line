// «Вільне полотно» → «Цілим шматком» (ТЗ v0.9 §5.1): every element is cut out of the
// material as one solid piece (topper, sign letters). Elements are united; with «З'єднати
// автоматично» loose parts get short straight connectors at the closest points, width
// max(CONNECTOR_WIDTH_MIN_MM, 12 % of the smallest element height).

import type { Polygon, Vec2, WeldResult } from "../../types/geometry";
import { bboxOf, polygonsNetArea, polygonsPerimeter } from "../calculators/geometry";
import { FillRule, union, unionTree } from "./clipper";
import { CONSTRUCTOR_CONFIG as C } from "./config";
import { joinPieces, piecesOf } from "./weld";

/** Connector width for the canvas: at least the minimum, 12 % of the smallest element. */
export function solidConnectorMm(smallestElementHeightMm: number): number {
  return Math.max(C.connectorWidthMinMm, C.connectorWidthRatio * smallestElementHeightMm);
}

export function solidPiece(groups: ReadonlyArray<ReadonlyArray<Polygon>>, connectorMm: number, autoJoin: boolean, scale: number): WeldResult {
  const parts: Vec2[][] = [];
  // Holes are resolved inside every glyph or shape (even-odd), then everything is united.
  for (const group of groups) if (group.length) parts.push(...union(group as Polygon[], scale, FillRule.EvenOdd));
  let shape: Vec2[][] = parts.length ? union(parts, scale) : [];
  if (autoJoin && shape.length) shape = joinPieces(shape, connectorMm, scale);
  const pieces = piecesOf(unionTree(shape, scale));
  const shapes = pieces.flatMap((piece) => piece.all);
  return {
    shapes,
    pieces: pieces.length,
    bbox: shapes.length ? bboxOf(shapes) : { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    areaMm2: polygonsNetArea(shapes),
    cutLengthMm: polygonsPerimeter(shapes),
  };
}
