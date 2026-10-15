// Size of an office plaque: a preset by its code, or a custom size inside the limits.
// clampPlaqueSizeMm keeps what the customer types inside the limits; resolvePlaqueSize
// refuses anything outside them (server).

import type { OfficePlaqueConfig, OfficePlaqueDesign } from "../../types/office-plaque";
import { DEFAULT_OFFICE_PLAQUE_CONFIG } from "./config";

export function clampPlaqueSizeMm(widthMm: number, heightMm: number, cfg: OfficePlaqueConfig = DEFAULT_OFFICE_PLAQUE_CONFIG): { widthMm: number; heightMm: number } {
  const safe = (v: number, fallback: number) => (Number.isFinite(v) ? Math.round(v) : fallback);
  return {
    widthMm: Math.min(cfg.maxWidthMm, Math.max(cfg.minWidthMm, safe(widthMm, cfg.minWidthMm))),
    heightMm: Math.min(cfg.maxHeightMm, Math.max(cfg.minHeightMm, safe(heightMm, cfg.minHeightMm))),
  };
}

export function resolvePlaqueSize(
  design: Pick<OfficePlaqueDesign, "sizeCode" | "widthMm" | "heightMm">, cfg: OfficePlaqueConfig = DEFAULT_OFFICE_PLAQUE_CONFIG,
): { widthMm: number; heightMm: number; preset: string | null } {
  if (design.sizeCode !== "custom") {
    const preset = cfg.presets.find((p) => p.code === design.sizeCode);
    if (!preset) throw new Error(`Unknown plaque size: ${design.sizeCode}`);
    return { widthMm: preset.widthMm, heightMm: preset.heightMm, preset: preset.code };
  }
  const widthMm = Math.round(design.widthMm);
  const heightMm = Math.round(design.heightMm);
  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm)) throw new Error("Plaque size is not a number");
  if (widthMm < cfg.minWidthMm || widthMm > cfg.maxWidthMm || heightMm < cfg.minHeightMm || heightMm > cfg.maxHeightMm) {
    throw new Error(`Plaque size ${widthMm}×${heightMm} mm is out of range`);
  }
  return { widthMm, heightMm, preset: cfg.presets.find((p) => p.widthMm === widthMm && p.heightMm === heightMm)?.code ?? null };
}
