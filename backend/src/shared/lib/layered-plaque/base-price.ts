// Price of one two-layer plaque of a size before discounts: the preset price, or for a custom
// size the rate by area with the minimum, or (no rate) the preset prices followed by area:
// linear between the two nearest presets, the largest preset's price per cm² above it, the
// smallest preset's price below it. Rounded up to the step.

import type { LayeredPlaqueConfig } from "../../types/layered-plaque";

export function layeredPlaqueBasePrice(widthMm: number, heightMm: number, cfg: LayeredPlaqueConfig): number {
  const preset = cfg.presets.find((p) => p.widthMm === widthMm && p.heightMm === heightMm);
  if (preset) return preset.price;
  const area = (widthMm * heightMm) / 100;
  const roundUp = (v: number) => Math.ceil(v / cfg.roundTo - 1e-9) * cfg.roundTo;
  if (cfg.customRatePerCm2 != null) return Math.max(cfg.minPrice, roundUp(area * cfg.customRatePerCm2));
  const byArea = [...cfg.presets].map((p) => ({ area: (p.widthMm * p.heightMm) / 100, price: p.price })).sort((a, b) => a.area - b.area);
  const first = byArea[0];
  const last = byArea[byArea.length - 1];
  if (area <= first.area) return Math.max(cfg.minPrice, first.price);
  if (area >= last.area) return Math.max(cfg.minPrice, roundUp((last.price * area) / last.area));
  const upper = byArea.findIndex((p) => p.area >= area);
  const a = byArea[upper - 1];
  const b = byArea[upper];
  return Math.max(cfg.minPrice, roundUp(a.price + ((b.price - a.price) * (area - a.area)) / (b.area - a.area)));
}
