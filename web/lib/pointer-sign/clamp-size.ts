// Keeps a custom size typed by the customer (cm) inside the limits of the config, so the
// constructor always shows a size that can be made and priced.

import type { PointerSignConfig } from "../../types/pointer-sign";
import { DEFAULT_POINTER_SIGN_CONFIG } from "./config";

export function clampPointerSizeMm(
  widthMm: number, heightMm: number, cfg: PointerSignConfig = DEFAULT_POINTER_SIGN_CONFIG,
): { widthMm: number; heightMm: number } {
  const safe = (v: number, fallback: number) => (Number.isFinite(v) ? Math.round(v) : fallback);
  const width = Math.min(cfg.maxWidthMm, Math.max(cfg.minWidthMm, safe(widthMm, cfg.minWidthMm)));
  const maxHeight = Math.min(cfg.maxHeightMm, Math.floor(width * cfg.maxHeightToWidth));
  const height = Math.min(maxHeight, Math.max(cfg.minHeightMm, safe(heightMm, cfg.minHeightMm)));
  return { widthMm: width, heightMm: height };
}
