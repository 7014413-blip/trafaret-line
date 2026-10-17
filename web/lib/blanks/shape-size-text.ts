// Size of a blank shape with its unit, in the page language: «Ø10 см», «10 см», «20×30 см»
// (English: "Ø10 cm"). Used by the order title, the size chips and the scheme.

import type { BlankShape } from "../../types/blank";
import type { Locale } from "../../types/customizer";
import { units } from "../i18n/dictionaries/units";
import { cmText } from "../format";

export function blankShapeSizeText(shape: Pick<BlankShape, "sizeMode">, widthMm: number, heightMm: number, locale: Locale = "uk"): string {
  const cm = units(locale).cm;
  if (shape.sizeMode === "diameter") return `Ø${cmText(widthMm, locale)} ${cm}`;
  if (shape.sizeMode === "side") return `${cmText(widthMm, locale)} ${cm}`;
  return `${cmText(widthMm, locale)}×${cmText(heightMm, locale)} ${cm}`;
}
