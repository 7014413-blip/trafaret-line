// One order for the printable invoice, from the internal Medusa route
// (GET /internal/tl-invoice/:id, Bearer INTERNAL_API_TOKEN). The public /store/orders/:id is
// closed; the buyer's link is signed (lib/security/order-link.ts).

import "server-only";
import type { B2BCompany, InvoiceOrder } from "../types/invoice";
import { requireEnv, UpstreamError } from "./config";

interface RawOrder {
  id: string;
  display_id: number;
  created_at: string;
  metadata?: { payment?: string; company?: B2BCompany | null } | null;
  items?: { title: string; quantity: number; unit_price: number }[];
}

/** Invoice data of an order paid by invoice; null when the order does not exist or is not an invoice order. */
export async function invoiceOrder(orderId: string): Promise<InvoiceOrder | null> {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) return null;
  const url = (process.env.MEDUSA_INTERNAL_URL ?? process.env.NEXT_PUBLIC_MEDUSA_URL ?? "").replace(/\/$/, "");
  const { INTERNAL_API_TOKEN } = requireEnv("internal", ["INTERNAL_API_TOKEN"]);
  const response = await fetch(`${url}/internal/tl-invoice/${orderId}`, {
    headers: { authorization: `Bearer ${INTERNAL_API_TOKEN}`, accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new UpstreamError("internal", `Medusa order: HTTP ${response.status}`, response.status);
  const { order } = (await response.json()) as { order: RawOrder };
  const company = order.metadata?.company;
  if (order.metadata?.payment !== "invoice" || !company) return null;
  return {
    number: `TL-${order.display_id}`,
    createdAt: order.created_at,
    company,
    lines: (order.items ?? []).map((i) => ({ title: i.title, quantity: Number(i.quantity), unitPrice: Number(i.unit_price) })),
  };
}
