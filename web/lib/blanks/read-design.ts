// Reads a blank design sent by the browser (checkout): the shape, the sheet (material and
// colour on sale) and the size inside the limits are checked, unknown fields are dropped.
// Throws on anything the shop cannot cut.

import type { BlankDesign } from "../../types/blank";
import type { DesignReader } from "../../types/design-reader";
import { createDesignReader } from "../validation/design-reader";
import { findBlankShape } from "./shapes";
import { findBlankSheet } from "./sheets";
import { BLANK_SIZE_LIMITS_MM, blankSheetMm } from "./size";

const read: DesignReader = createDesignReader("blank");

function side(value: unknown, what: string): number {
  const mm = read.num(value, what);
  if (mm < BLANK_SIZE_LIMITS_MM.min || mm > BLANK_SIZE_LIMITS_MM.max) read.fail(`${what} out of range`);
  return mm;
}

export function readBlankDesign(raw: unknown, quantity: number): BlankDesign {
  const d = read.record(raw, "design");
  const shape = findBlankShape(String(d.shapeId ?? ""));
  if (!shape) return read.fail("unknown shape");
  const sheet = findBlankSheet(String(d.materialId ?? ""), String(d.colourId ?? ""));
  if (!sheet) return read.fail("sheet not on sale");
  const width = side(d.widthMm, "width");
  const height = shape.sizeMode === "box" ? side(d.heightMm, "height") : width;
  const size = blankSheetMm(shape, width, height);
  return {
    shapeId: shape.id, widthMm: size.widthMm, heightMm: size.heightMm,
    materialId: sheet.materialId, colourId: sheet.colourId, quantity: read.quantity(quantity),
  };
}
