// Sizes of a blank: limits and the sheet the price is counted on. A circle is given by its
// diameter and the other one-number shapes by the larger side, so their sheet is the square
// around them (as the catalogue cards); a rectangle is width × height.

import type { BlankShape } from "../../types/blank";
import type { SheetSize } from "../../types/customizer";

/** Smallest and largest side of a blank, mm (Claude default 2026-10-16: 2 cm to 1 m). */
export const BLANK_SIZE_LIMITS_MM = { min: 20, max: 1000 } as const;

/** Rounds to whole millimetres and keeps the side inside the limits. */
export function clampBlankSideMm(mm: number): number {
  const whole = Math.round(Number.isFinite(mm) ? mm : BLANK_SIZE_LIMITS_MM.min);
  return Math.min(BLANK_SIZE_LIMITS_MM.max, Math.max(BLANK_SIZE_LIMITS_MM.min, whole));
}

/** Size of one size chip («10 см» or «20×30 см»), mm. */
export function presetMm(preset: number | readonly [number, number]): { widthMm: number; heightMm: number } {
  return typeof preset === "number"
    ? { widthMm: Math.round(preset * 10), heightMm: Math.round(preset * 10) }
    : { widthMm: Math.round(preset[0] * 10), heightMm: Math.round(preset[1] * 10) };
}

/** Width and height of the priced sheet: one-number shapes are square. */
export function blankSheetMm(shape: BlankShape, widthMm: number, heightMm: number): { widthMm: number; heightMm: number } {
  const width = clampBlankSideMm(widthMm);
  return { widthMm: width, heightMm: shape.sizeMode === "box" ? clampBlankSideMm(heightMm) : width };
}

/** Sheet of the blank for the calculators (price and weight). */
export function blankSheet(shape: BlankShape, widthMm: number, heightMm: number): SheetSize {
  return { shape: shape.sheetShape, ...blankSheetMm(shape, widthMm, heightMm) };
}
