// Production part of a solid piece (a welded word, «Цілим шматком» from the canvas): the outer
// outline of every piece is cut on CUT_OUTER, its holes (counters of О, А) on CUT_INNER,
// first. The piece is moved to the origin and the sheet is its bounding box.

import type { Polygon, Vec2 } from "../../types/geometry";
import type { ProductionConstructor, ProductionPart } from "../../types/production";
import { bboxOf } from "../calculators/geometry";
import { unionTree } from "../geometry/clipper";
import { DEFAULT_LASER } from "../geometry/laser-config";
import { piecesOf } from "../geometry/weld";
import { weldThumbnailSvg } from "./cart-thumbnail";

export function pieceProductionPart(shapes: ReadonlyArray<Polygon>, constructor: ProductionConstructor, colourHex: string, warnings: string[]): ProductionPart {
  const box = bboxOf(shapes);
  const moved = shapes.map((polygon) => polygon.map(([x, y]) => [x - box.minX, y - box.minY] as Vec2));
  const widthMm = box.maxX - box.minX;
  const heightMm = box.maxY - box.minY;
  const pieces = piecesOf(unionTree(moved, DEFAULT_LASER.clipperScale));
  return {
    constructor,
    part: {
      sheet: { shape: "custom", widthMm, heightMm },
      outerCut: pieces.map((piece) => piece.outer),
      cutPaths: pieces.flatMap((piece) => piece.all.slice(1)),
    },
    previewSvg: weldThumbnailSvg(widthMm, heightMm, moved, colourHex),
    widthMm,
    heightMm,
    warnings,
  };
}
