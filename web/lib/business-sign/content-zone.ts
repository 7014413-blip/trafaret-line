// Area of a business sign where the logo and the text lines go (mm, origin at the centre, Y down),
// and on round signs the band of the edge text with the thin ring under it.

import type { BusinessSignConfig, BusinessSignZone } from "../../types/business-sign";
import type { SignShape } from "../../types/signage";
import { headLength } from "../calculators/signage";

/** Half height of the arrow body, share of the sign height (signOutline draws it at ±0.22 h). */
const ARROW_BODY_HALF_SHARE = 0.22;

export interface BusinessSignContent {
  zone: BusinessSignZone;
  /** Round signs with edge text: the band and the ring between it and the centre. */
  arcBand: { inner: number; outer: number } | null;
  innerRing: { r: number; stroke: number } | null;
}

export function businessSignContent(
  shape: SignShape, widthMm: number, heightMm: number, direction: -1 | 1,
  /** Distance from the edge to the content: frame, its stroke and the padding, or the hole ring. */
  edgeMm: number, hasArc: boolean, ringStroke: number, cfg: BusinessSignConfig,
): BusinessSignContent {
  const w = widthMm;
  const h = heightMm;
  const short = Math.min(w, h);
  const padding = short * cfg.paddingShare;

  if (shape === "circle") {
    const outer = w / 2 - edgeMm;
    let inner = outer;
    let arcBand: BusinessSignContent["arcBand"] = null;
    let innerRing: BusinessSignContent["innerRing"] = null;
    if (hasArc) {
      const band = outer * cfg.arcBandShare;
      arcBand = { inner: outer - band, outer };
      innerRing = { r: outer - band - ringStroke / 2, stroke: ringStroke };
      inner = outer - band - ringStroke - padding * 0.6;
    }
    // The largest 4:3 rectangle in the inner circle: half sides 0.8 r and 0.6 r.
    const r = Math.max(0, inner);
    return { zone: { left: -0.8 * r, right: 0.8 * r, top: -0.6 * r, bottom: 0.6 * r }, arcBand, innerRing };
  }

  if (shape === "arrow" || shape === "pointer") {
    const head = headLength({ shape, widthMm: w, heightMm: h, direction, materialId: "", thicknessMm: 0 });
    const bodyHalf = shape === "arrow" ? h * ARROW_BODY_HALF_SHARE : h / 2;
    const margin = Math.max(6, bodyHalf * 0.22);
    // Body from the tail to the start of the head, for a sign pointing right; mirrored for left.
    const tail = -w / 2 + margin;
    const front = w / 2 - head - margin * 0.5;
    const left = direction === 1 ? tail : -front;
    const right = direction === 1 ? front : -tail;
    return { zone: { left, right, top: -bodyHalf + margin, bottom: bodyHalf - margin }, arcBand: null, innerRing: null };
  }

  return { zone: { left: -w / 2 + edgeMm, right: w / 2 - edgeMm, top: -h / 2 + edgeMm, bottom: h / 2 - edgeMm }, arcBand: null, innerRing: null };
}
