// Order line title of a configured blank, built the same way in the cart and on the server:
// «Заготовка «Коло» Ø10 см, акрил 3 мм, прозорий».

import type { BlankDesign } from "../../types/blank";
import { blankShape } from "./shapes";
import { blankSheetName } from "./sheets";
import { blankSheetMm } from "./size";

const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

/** Size as the customer chose it: «Ø10 см», «10 см», «20×30 см». */
export function blankSizeText(design: Pick<BlankDesign, "shapeId" | "widthMm" | "heightMm">): string {
  const shape = blankShape(design.shapeId);
  const size = blankSheetMm(shape, design.widthMm, design.heightMm);
  if (shape.sizeMode === "diameter") return `Ø${cm(size.widthMm)} см`;
  if (shape.sizeMode === "side") return `${cm(size.widthMm)} см`;
  return `${cm(size.widthMm)}×${cm(size.heightMm)} см`;
}

export function blankTitle(design: BlankDesign): string {
  const shape = blankShape(design.shapeId);
  const sheet = blankSheetName(design.materialId, design.colourId);
  // «Акрил 3 мм» → «акрил 3 мм», but «PET 0,5 мм» keeps its capitals.
  const lowered = /^\p{Lu}\p{Ll}/u.test(sheet) ? `${sheet.charAt(0).toLowerCase()}${sheet.slice(1)}` : sheet;
  return `Заготовка «${shape.name.uk}» ${blankSizeText(design)}, ${lowered}`;
}
