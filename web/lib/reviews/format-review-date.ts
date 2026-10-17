// Date of a review as the site shows it: «16 жовтня 2026» («16 октября 2026» in Russian).

import type { Locale } from "../../types/customizer";
import { INTL_TAG } from "../i18n/messages";

export function formatReviewDate(iso: string, locale: Locale = "uk"): string {
  return new Intl.DateTimeFormat(INTL_TAG[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Kyiv" }).format(new Date(iso)).replace(/\s*(р|г)\.$/, "");
}
