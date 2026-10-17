// Sends one analytics event: to the GTM dataLayer (GA4 reads it there) and, for events Meta
// knows, to the pixel with the same event_id. Without the tags on the page nothing happens.
// GA4 asks to clear the previous «ecommerce» object before pushing a new one.

import type { AnalyticsEventName, AnalyticsParams, AnalyticsWindow, DataLayerEvent } from "../../types/analytics";
import { metaEvent } from "./meta-event";

function eventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

const ECOMMERCE_KEYS: (keyof AnalyticsParams)[] = ["currency", "value", "items", "transaction_id", "shipping", "shipping_tier", "payment_type", "item_list_name"];

export function trackEvent(name: AnalyticsEventName, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  const target = window as unknown as AnalyticsWindow;
  const id = eventId();
  const ecommerce = ECOMMERCE_KEYS.some((key) => params[key] !== undefined) ? { currency: "UAH" as const, ...params } : undefined;
  if (target.dataLayer) {
    const event: DataLayerEvent = { event: name, event_id: id };
    if (ecommerce) {
      target.dataLayer.push({ ecommerce: null });
      event.ecommerce = ecommerce;
    }
    if (params.link_type) event.link_type = params.link_type;
    if (params.constructor_name) event.constructor_name = params.constructor_name;
    target.dataLayer.push(event);
  }
  const meta = metaEvent(name, params);
  if (meta && target.fbq) target.fbq("track", meta.name, meta.params, { eventID: id });
}
