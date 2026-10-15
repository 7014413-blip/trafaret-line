// Frame of a business sign: a mirror line along the edge (rectangle, rounded rectangle, square
// or circle; arrows and pointers have none). With mounting holes the frame passes inside the
// standoffs, so the caps never sit on it.

import type { BusinessSignConfig, BusinessSignLayout } from "../../types/business-sign";
import type { SignPricingConfig, SignShape } from "../../types/signage";

export interface BusinessSignFrameSize {
  inset: number;
  stroke: number;
}

export function businessSignFrameSize(
  widthMm: number, heightMm: number, holes: number, cfg: BusinessSignConfig, signCfg: SignPricingConfig,
): BusinessSignFrameSize {
  const short = Math.min(widthMm, heightMm);
  const stroke = Math.max(cfg.frameWidthMinMm, short * cfg.frameWidthShare);
  let inset = Math.max(cfg.frameInsetMinMm, short * cfg.frameInsetShare);
  if (holes > 0) inset = Math.max(inset, signCfg.holeEdgeOffsetMm + signCfg.holeDiameterMm / 2 + 4);
  return { inset, stroke };
}

export function businessSignFrame(
  shape: SignShape, widthMm: number, heightMm: number, size: BusinessSignFrameSize,
): BusinessSignLayout["frame"] {
  if (shape === "arrow" || shape === "pointer") return null;
  if (shape === "circle") return { kind: "circle", r: widthMm / 2 - size.inset - size.stroke / 2, stroke: size.stroke };
  const x = -widthMm / 2 + size.inset + size.stroke / 2;
  const y = -heightMm / 2 + size.inset + size.stroke / 2;
  const width = widthMm - 2 * (size.inset + size.stroke / 2);
  const height = heightMm - 2 * (size.inset + size.stroke / 2);
  // The rounded base has corners of 12 % of the shorter side (signOutline); the frame follows them.
  const corner = shape === "rounded" ? Math.max(0, Math.min(widthMm, heightMm) * 0.12 - size.inset) : 0;
  return { kind: "rect", x, y, width, height, corner, stroke: size.stroke };
}
