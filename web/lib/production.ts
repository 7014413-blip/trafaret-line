// Production and shipping date shown next to "Купити" and in the cart.
// ТЗ: production up to 3 working days. We never promise "today"; we show the expected
// dispatch date in working days, plus a manual load setting from the admin.

import type { Locale } from "../types/customizer";
import { INTL_TAG, MESSAGES } from "./i18n/messages";

export interface ProductionConfig {
  productionDays: number;       // 3 (ТЗ)
  cutoffHour: number;           // orders paid after this hour (Kyiv) count from the next working day
  /** Extra days the manager sets when the laser is busy (0 normally). */
  extraLoadDays: number;
  /** Public holidays and days off, "YYYY-MM-DD" (Kyiv). */
  daysOff: string[];
  /** Working weekdays, 1 = Monday … 7 = Sunday. */
  workingWeekdays: number[];
}

export const DEFAULT_PRODUCTION: ProductionConfig = {
  productionDays: 3,
  cutoffHour: 14,               // approved with all defaults, 2026-10-08
  extraLoadDays: 0,
  daysOff: [],
  workingWeekdays: [1, 2, 3, 4, 5],
};

const KYIV = "Europe/Kyiv";

function kyivParts(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: KYIV, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false, weekday: "short" });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday) + 1;
  return { ymd: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, weekday: wd };
}

/** Expected dispatch date (Kyiv calendar) for an order paid at `now`. */
export function estimateDispatchDate(now: Date = new Date(), cfg: ProductionConfig = DEFAULT_PRODUCTION): Date {
  const isWorking = (d: Date) => {
    const k = kyivParts(d);
    return cfg.workingWeekdays.includes(k.weekday) && !cfg.daysOff.includes(k.ymd);
  };
  const day = new Date(now);
  const start = kyivParts(now);
  // Paid after the cut-off or on a day off: counting starts from the next working day.
  let toCount = cfg.productionDays + cfg.extraLoadDays;
  if (isWorking(day) && start.hour < cfg.cutoffHour) toCount -= 1; // today counts as day 1
  while (toCount > 0 || !isWorking(day)) {
    day.setUTCDate(day.getUTCDate() + 1);
    if (isWorking(day)) toCount -= 1;
  }
  return day;
}

/** "Відправка: понеділок, 12 жовтня" / "Ships: Monday, 12 October" (no grammar traps). */
export function formatDispatch(d: Date, locale: Locale = "uk"): string {
  const s = new Intl.DateTimeFormat(INTL_TAG[locale], { timeZone: KYIV, weekday: "long", day: "numeric", month: "long" }).format(d);
  return `${MESSAGES[locale].dispatch}: ${s}`;
}
