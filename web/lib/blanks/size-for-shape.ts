// Size step after the customer picks another shape: the same size when the new shape has that
// chip, the typed size when both shapes take one number, otherwise the 10 cm chip or the first one.

import type { BlankShapeId, BlankSizeValue } from "../../types/blank";
import { blankShape } from "./shapes";
import { presetMm } from "./size";

export function sizeForShape(shapeId: BlankShapeId, size: BlankSizeValue): BlankSizeValue {
  const shape = blankShape(shapeId);
  const presets = shape.presetsCm.map(presetMm);
  const same = presets.findIndex((p) => p.widthMm === size.widthMm && p.heightMm === size.heightMm);
  if (same >= 0) return { preset: same, ...presets[same] };
  if (shape.sizeMode !== "box" && size.preset == null) return { preset: null, widthMm: size.widthMm, heightMm: size.widthMm };
  const ten = presets.findIndex((p) => p.widthMm === 100);
  const index = ten >= 0 ? ten : 0;
  return { preset: index, ...presets[index] };
}
