// An order with its lines in the order the customer placed them (metadata.position, set at
// checkout; older orders by creation time), as the production files need it.

import type { OrderForFiles, QueryGraph } from "../../types/order-files";

interface RawItem {
  id: string;
  title: string;
  quantity: number;
  created_at?: string | Date;
  metadata?: Record<string, unknown> | null;
}

const positionOf = (item: RawItem) => (typeof item.metadata?.position === "number" ? item.metadata.position : Number.MAX_SAFE_INTEGER);

/** The order, or null when there is no order with this id. */
export async function loadOrderForFiles(graph: QueryGraph, orderId: string): Promise<OrderForFiles | null> {
  const { data } = await graph({
    entity: "order",
    fields: ["id", "display_id", "items.id", "items.title", "items.quantity", "items.created_at", "items.metadata"],
    filters: { id: orderId },
  });
  const order = data[0] as { id: string; display_id: number; items?: RawItem[] } | undefined;
  if (!order) return null;
  const items = [...(order.items ?? [])].sort((a, b) =>
    positionOf(a) - positionOf(b) || String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")) || a.id.localeCompare(b.id));
  return {
    id: order.id,
    displayId: order.display_id,
    items: items.map((item) => ({ title: item.title, quantity: Number(item.quantity), metadata: item.metadata ?? null })),
  };
}
