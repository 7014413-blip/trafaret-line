// GET /internal/tl-invoice/:id — data for the printable invoice page of the storefront.
// Server-to-server only (Authorization: Bearer INTERNAL_API_TOKEN); the public
// /store/orders/:id is closed in api/middlewares.ts so an order id alone reveals nothing.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { isInternalBearer } from "../../../../lib/order-link";

interface InvoiceRow {
  id: string;
  display_id: number | string;
  created_at: string | Date;
  metadata?: Record<string, unknown> | null;
  items?: { title: string; quantity: number; unit_price: number }[];
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isInternalBearer(req.headers.authorization)) return res.status(401).json({ message: "Unauthorized" });
  const id = String(req.params.id ?? "");
  if (!/^order_[A-Za-z0-9]+$/.test(id)) return res.status(404).json({ message: "Not found" });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "created_at", "metadata", "items.title", "items.quantity", "items.unit_price"],
    filters: { id },
  });
  const order = (data as unknown as InvoiceRow[])[0];
  if (!order) return res.status(404).json({ message: "Not found" });
  return res.json({
    order: {
      id: order.id,
      display_id: order.display_id,
      created_at: new Date(order.created_at).toISOString(),
      metadata: order.metadata ?? null,
      items: (order.items ?? []).map((i) => ({ title: i.title, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
    },
  });
}
