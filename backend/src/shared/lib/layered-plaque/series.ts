// Numbers of a series (floors 1…9, flats 1…120): every number is its own plaque.

import type { LayeredPlaqueConfig, LayeredPlaqueSeries } from "../../types/layered-plaque";

export function seriesNumbers(series: LayeredPlaqueSeries | null): number[] {
  if (!series) return [];
  const out: number[] = [];
  for (let n = series.from; n <= series.to; n++) out.push(n);
  return out;
}

/** The series is usable: whole numbers from 0, from ≤ to, not more plaques than allowed. */
export function seriesValid(series: LayeredPlaqueSeries, cfg: LayeredPlaqueConfig): boolean {
  return Number.isInteger(series.from) && Number.isInteger(series.to) && series.from >= 0 && series.to >= series.from
    && series.to - series.from + 1 <= cfg.maxSeries && series.to < 100000;
}

/** Number of plaques in one set. */
export function plaquesInSet(series: LayeredPlaqueSeries | null): number {
  return series ? series.to - series.from + 1 : 1;
}
