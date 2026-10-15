// Size of a pointer sign: a fixed size by its code, or a custom size inside the limits.

import type { PointerSignConfig, PointerSignDesign, PointerSizePreset } from "../../types/pointer-sign";
import { DEFAULT_POINTER_SIGN_CONFIG } from "./config";

export interface ResolvedPointerSize {
  widthMm: number;
  heightMm: number;
  preset: PointerSizePreset | null;
}

/** Throws when a custom size is outside the limits or a preset code is unknown. */
export function resolvePointerSize(
  design: Pick<PointerSignDesign, "sizeCode" | "widthMm" | "heightMm">, cfg: PointerSignConfig = DEFAULT_POINTER_SIGN_CONFIG,
): ResolvedPointerSize {
  if (design.sizeCode !== "custom") {
    const preset = cfg.presets.find((p) => p.code === design.sizeCode);
    if (!preset) throw new Error(`Unknown pointer sign size: ${design.sizeCode}`);
    return { widthMm: preset.widthMm, heightMm: preset.heightMm, preset };
  }
  const widthMm = Math.round(design.widthMm);
  const heightMm = Math.round(design.heightMm);
  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm)) throw new Error("Pointer sign size is not a number");
  if (widthMm < cfg.minWidthMm || widthMm > cfg.maxWidthMm) throw new Error(`Pointer sign width ${widthMm} mm is out of range`);
  if (heightMm < cfg.minHeightMm || heightMm > cfg.maxHeightMm) throw new Error(`Pointer sign height ${heightMm} mm is out of range`);
  if (heightMm > widthMm * cfg.maxHeightToWidth + 0.5) throw new Error("Pointer sign is too tall for its width");
  // A custom size equal to a fixed one gets the fixed price.
  const preset = cfg.presets.find((p) => p.widthMm === widthMm && p.heightMm === heightMm) ?? null;
  return { widthMm, heightMm, preset };
}
