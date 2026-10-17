"use client";

// Sends one analytics event when a page opens (view_item, view_item_list); server pages pass
// the parameters they already have.

import { useEffect } from "react";
import type { AnalyticsEventName, AnalyticsParams } from "@/types/analytics";
import { trackEvent } from "@/lib/analytics/track-event";

export function TrackEvent({ name, params }: { name: AnalyticsEventName; params: AnalyticsParams }) {
  const key = JSON.stringify(params);
  useEffect(() => {
    trackEvent(name, JSON.parse(key) as AnalyticsParams);
  }, [name, key]);
  return null;
}
