// «Мої замовлення»: the latest orders of the signed-in customer, with stage, parcel number and
// every line priced again for «Повторити». Google accounts also see the orders placed as a
// guest with the same (verified) e-mail before the first sign-in.

import type { AccountOrder } from "../../shared/types/account";
import type { AccountOrderRecord, CustomerRecord, CustomerStore } from "../../types/account";
import { trackingUrl } from "../../shared/lib/account/tracking-url";
import { sortOrderItems } from "../orders/sort-items";
import { variantPrices } from "../orders/variant-prices";
import { orderStage } from "./order-stage";
import { previewImageUrl } from "./preview-image-url";
import { repeatItem } from "./repeat-line";
import { isTelegramEmail } from "./telegram-profile";

/** The cabinet shows the latest orders; older ones the manager finds by number. */
export const ACCOUNT_ORDERS_LIMIT = 30;

type Graph = { graph: (args: Record<string, unknown>) => Promise<{ data: unknown[] }> };

const FIELDS = [
  "id", "display_id", "customer_id", "status", "created_at", "metadata",
  "items.id", "items.title", "items.quantity", "items.unit_price", "items.thumbnail", "items.created_at", "items.metadata",
  "fulfillments.shipped_at", "fulfillments.canceled_at", "fulfillments.labels.tracking_number",
];

async function customerIds(customers: CustomerStore, customer: CustomerRecord): Promise<string[]> {
  if (customer.metadata?.login !== "google" || isTelegramEmail(customer.email)) return [customer.id];
  const guests = await customers.listCustomers({ email: customer.email, has_account: false });
  return [customer.id, ...guests.map((g) => g.id)];
}

export async function accountOrders(query: Graph, customers: CustomerStore, customer: CustomerRecord): Promise<AccountOrder[]> {
  const ids = await customerIds(customers, customer);
  const { data } = await query.graph({
    entity: "order",
    fields: FIELDS,
    filters: { customer_id: ids },
    pagination: { order: { created_at: "DESC" }, take: ACCOUNT_ORDERS_LIMIT },
  });
  const orders = data as AccountOrderRecord[];
  const variantIds = new Set<string>();
  for (const order of orders) {
    for (const item of order.items ?? []) {
      const id = item.metadata?.variantId;
      if (item.metadata?.kind === "catalog" && typeof id === "string") variantIds.add(id);
    }
  }
  const variants = await variantPrices(query, [...variantIds]);

  return orders.map((order) => {
    const { stage, statusText, ttn } = orderStage(order);
    return {
      id: order.id,
      number: `TL-${order.display_id}`,
      createdAt: new Date(order.created_at).toISOString(),
      // Delivery is paid to the carrier and the checkout adds no discounts, so the lines are the total.
      total: (order.items ?? []).reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0),
      stage,
      statusText,
      ttn,
      trackingUrl: ttn ? trackingUrl(ttn) : null,
      items: sortOrderItems(order.items ?? []).map((item) => ({
        title: item.title,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        thumbnail: previewImageUrl(item),
        ...repeatItem(item, variants, order.customer_id === customer.id),
      })),
    };
  });
}
