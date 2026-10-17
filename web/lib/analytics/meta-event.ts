// The Meta pixel event for a GA4 event, with its parameters (content_ids are the GA4 item ids,
// so they match the product feed). Events Meta has no standard name for are not sent there.

import type { AnalyticsEventName, AnalyticsParams } from "../../types/analytics";

const META_NAMES: Partial<Record<AnalyticsEventName, string>> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  phone_click: "Contact",
  messenger_click: "Contact",
};

export interface MetaEvent {
  name: string;
  params: Record<string, unknown>;
}

export function metaEvent(name: AnalyticsEventName, params: AnalyticsParams): MetaEvent | null {
  const metaName = META_NAMES[name];
  if (!metaName) return null;
  const items = params.items ?? [];
  return {
    name: metaName,
    params: {
      ...(params.value !== undefined ? { value: params.value, currency: params.currency ?? "UAH" } : {}),
      ...(items.length ? {
        content_type: "product",
        content_ids: items.map((i) => i.item_id),
        contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      } : {}),
      ...(params.transaction_id ? { order_id: params.transaction_id } : {}),
    },
  };
}
