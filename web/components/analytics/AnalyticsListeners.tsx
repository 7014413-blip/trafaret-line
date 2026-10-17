"use client";

// Page-wide analytics: remembers where the visit came from (UTM, gclid, fbclid) on every page,
// sends a Meta «PageView» on client-side navigation (GTM tracks GA4 page views itself), turns
// clicks on phone and messenger links into events, and reports «constructor_start» at the first
// change a buyer makes in a constructor.

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { AnalyticsWindow } from "@/types/analytics";
import { linkEvent } from "@/lib/analytics/link-event";
import { trackEvent } from "@/lib/analytics/track-event";
import { rememberAttribution } from "@/lib/client/attribution-storage";

const CONSTRUCTOR_PATHS = /^\/(konstruktor|vyvisky|zahotovky|na-zamovlennia)(\/|$)/;

export function AnalyticsListeners() {
  const pathname = usePathname();
  const firstPage = useRef(true);

  useEffect(() => {
    rememberAttribution(new URL(window.location.href), new Date());
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    (window as unknown as AnalyticsWindow).fbq?.("track", "PageView");
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const found = link ? linkEvent(link.getAttribute("href") ?? "") : null;
      if (found) trackEvent(found.name, { link_type: found.linkType });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!CONSTRUCTOR_PATHS.test(pathname)) return;
    let started = false;
    const onChange = (event: Event) => {
      if (started || !(event.target as Element | null)?.closest?.("main")) return;
      started = true;
      trackEvent("constructor_start", { constructor_name: pathname });
    };
    document.addEventListener("input", onChange, true);
    document.addEventListener("change", onChange, true);
    return () => {
      document.removeEventListener("input", onChange, true);
      document.removeEventListener("change", onChange, true);
    };
  }, [pathname]);

  return null;
}
