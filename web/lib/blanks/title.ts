// Order line title of a configured blank, built the same way in the cart and on the server:
// «Заготовка «Коло» Ø10 см, акрил 3 мм, прозорий».

import type { BlankDesign } from "../../types/blank";
import type { Locale } from "../../types/customizer";
import { blankShape } from "./shapes";
import { blankSheetName } from "./sheets";
import { blankSheetMm } from "./size";
import { blankShapeSizeText } from "./shape-size-text";
import { BLANKS } from "../i18n/dictionaries/blanks";
import { tr } from "../i18n/translate";

/** Size as the customer chose it, in the page language: «Ø10 см», «10 см», «20×30 см». */
export function blankSizeText(design: Pick<BlankDesign, "shapeId" | "widthMm" | "heightMm">, locale: Locale = "uk"): string {
  const shape = blankShape(design.shapeId);
  const size = blankSheetMm(shape, design.widthMm, design.heightMm);
  return blankShapeSizeText(shape, size.widthMm, size.heightMm, locale);
}

/** The title in the page language; the server writes the Ukrainian one into the order. */
export function blankTitle(design: BlankDesign, locale: Locale = "uk"): string {
  const shape = blankShape(design.shapeId);
  const sheet = blankSheetName(design.materialId, design.colourId, locale);
  // «Акрил 3 мм» → «акрил 3 мм», but «PET 0,5 мм» keeps its capitals.
  const lowered = /^\p{Lu}\p{Ll}/u.test(sheet) ? `${sheet.charAt(0).toLowerCase()}${sheet.slice(1)}` : sheet;
  return tr(BLANKS, locale).cartTitle(shape.name[locale], blankSizeText(design, locale), lowered);
}
