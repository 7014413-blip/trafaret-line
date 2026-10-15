// Size of a two-layer plaque: a preset by its code, or a custom size inside the limits.
// clampLayeredPlaqueSizeMm keeps what the customer types inside the limits;
// resolveLayeredPlaqueSize refuses anything outside them (server).

import type { LayeredPlaqueConfig, LayeredPlaqueDesign, LayeredPlaquePreset } from "../../types/layered-plaque";

export function clampLayeredPlaqueSizeMm(widthMm: number, heightMm: number, cfg: LayeredPlaqueConfig): { widthMm: number; heightMm: number } {
  const safe = (v: number, fallback: number) => (Number.isFinite(v) ? Math.round(v) : fallback);
  return {
    widthMm: Math.min(cfg.maxWidthMm, Math.max(cfg.minWidthMm, safe(widthMm, cfg.minWidthMm))),
    heightMm: Math.min(cfg.maxHeightMm, Math.max(cfg.minHeightMm, safe(heightMm, cfg.minHeightMm))),
  };
}

export function resolveLayeredPlaqueSize(
  design: Pick<LayeredPlaqueDesign, "sizeCode" | "widthMm" | "heightMm">, cfg: LayeredPlaqueConfig,
): { widthMm: number; heightMm: number; preset: LayeredPlaquePreset | null } {
  if (design.sizeCode !== "custom") {
    const preset = cfg.presets.find((p) => p.code === design.sizeCode);
    if (!preset) throw new Error(`Unknown plaque size: ${design.sizeCode}`);
    return { widthMm: preset.widthMm, heightMm: preset.heightMm, preset };
  }
  const widthMm = Math.round(design.widthMm);
  const heightMm = Math.round(design.heightMm);
  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm)) throw new Error("Plaque size is not a number");
  if (widthMm < cfg.minWidthMm || widthMm > cfg.maxWidthMm || heightMm < cfg.minHeightMm || heightMm > cfg.maxHeightMm) {
    throw new Error(`Plaque size ${widthMm}×${heightMm} mm is out of range`);
  }
  return { widthMm, heightMm, preset: cfg.presets.find((p) => p.widthMm === widthMm && p.heightMm === heightMm) ?? null };
}
