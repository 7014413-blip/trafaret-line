"use client";

// Shipping date line of the constructors («відправимо в четвер, 15 жовтня»). It is set only in
// the browser: the server and the browser format weekdays differently, so the first render shows
// the plain lead time and the date replaces it after hydration.

import { useEffect, useState } from "react";
import type { Locale } from "../../types/customizer";
import { CONSTRUCTOR } from "../i18n/dictionaries/constructor";
import { tr } from "../i18n/translate";
import { estimateDispatchDate, formatDispatch } from "../production";

export function useDispatchLabel(locale: Locale = "uk"): string {
  const [label, setLabel] = useState(tr(CONSTRUCTOR, locale).production);
  useEffect(() => setLabel(formatDispatch(estimateDispatchDate(new Date()), locale)), [locale]);
  return label;
}
