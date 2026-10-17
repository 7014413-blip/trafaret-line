// Size of a blank shape with its unit, in the page language: «Ø10 см», «10 см», «20×30 см»
// (English: "Ø10 cm"). Used by the order title, the size chips and the scheme.

import type { BlankShape } from "../../types/blank";
import type { Locale } from "../../types/customizer";
import { units } from "../i18n/dictionaries/units";
import { localCm } from "../plaques/local-cm";

export function blankShapeSizeText(shape: Pick<BlankShape, "sizeMode">, widthMm: number, heightMm: number, locale: Locale = "uk"): string {
  const cm = units(locale).cm;
  if (shape.sizeMode === "diameter") return `Ø${localCm(widthMm, locale)} ${cm}`;
  if (shape.sizeMode === "side") return `${localCm(widthMm, locale)} ${cm}`;
  return `${localCm(widthMm, locale)}×${localCm(heightMm, locale)} ${cm}`;
}
