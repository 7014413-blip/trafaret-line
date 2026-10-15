// Base outline of a pointer sign, mm, origin at the sign centre, Y down.
// «pointer» is the pointed plate of the sign constructor (lib/calculators/signage.ts).
// «arrow» [default, Claude 2026-10-10, after Денис's renders]: the body is 64 % of the height,
// the head is the full height and as long as 0.8 of the height (at most 35 % of the width).

import type { PointerDirection, PointerShape } from "../../types/pointer-sign";
import type { SignBase } from "../../types/signage";
import { headLength, signOutline } from "../calculators/signage";

/** Half the body height of the «arrow» shape, share of the sign height. */
export const ARROW_BODY_HALF = 0.32;

export function pointerHeadLength(shape: PointerShape, widthMm: number, heightMm: number): number {
  if (shape === "arrow") return Math.min(heightMm * 0.8, widthMm * 0.35);
  const base: SignBase = { shape: "pointer", widthMm, heightMm, materialId: "", thicknessMm: 3 };
  return headLength(base);
}

export function pointerOutline(shape: PointerShape, widthMm: number, heightMm: number, direction: PointerDirection): [number, number][] {
  const w = widthMm;
  const h = heightMm;
  if (shape === "pointer") {
    const base: SignBase = { shape: "pointer", widthMm: w, heightMm: h, direction, materialId: "", thicknessMm: 3 };
    return signOutline(base).map(([x, y]) => [x - w / 2, y - h / 2] as [number, number]);
  }
  const head = pointerHeadLength(shape, w, h);
  const body = h * ARROW_BODY_HALF;
  const X = (v: number) => v * direction;
  return [
    [X(-w / 2), -body], [X(w / 2 - head), -body], [X(w / 2 - head), -h / 2], [X(w / 2), 0],
    [X(w / 2 - head), h / 2], [X(w / 2 - head), body], [X(-w / 2), body],
  ];
}
