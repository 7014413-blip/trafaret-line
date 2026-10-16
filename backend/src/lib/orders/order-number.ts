// Order number "TL-<display id>" of an order id, for the admin routes of the order files.

import type { QueryGraph } from "../../types/order-files";

export async function orderNumberOf(graph: QueryGraph, orderId: string): Promise<string | null> {
  const { data } = await graph({ entity: "order", fields: ["id", "display_id"], filters: { id: orderId } });
  const order = data[0] as { display_id?: number } | undefined;
  return order?.display_id ? `TL-${order.display_id}` : null;
}
