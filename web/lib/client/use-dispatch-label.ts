"use client";

// Shipping date line of the constructors («відправимо в четвер, 15 жовтня»). It is set only in
// the browser: the server and the browser format weekdays differently, so the first render shows
// the plain lead time and the date replaces it after hydration.

import { useEffect, useState } from "react";
import { estimateDispatchDate, formatDispatch } from "../production";

const LEAD_TIME = "виготовлення 3 робочі дні";

export function useDispatchLabel(): string {
  const [label, setLabel] = useState(LEAD_TIME);
  useEffect(() => setLabel(formatDispatch(estimateDispatchDate(new Date()))), []);
  return label;
}
