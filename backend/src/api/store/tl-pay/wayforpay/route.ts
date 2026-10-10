// POST /store/tl-pay/wayforpay { order_id } → fields for the WayForPay payment form.
// The storefront posts these fields to https://secure.wayforpay.com/pay.
// Amount and items are taken from the order in the database, not from the browser.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { purchaseFields } from "../../../../shared/lib/wayforpay";

export async function POST(req: MedusaRequest<{ order_id: string }>, res: MedusaResponse) {
  const { WFP_MERCHANT, WFP_SECRET, WFP_DOMAIN, STOREFRONT_URL, BACKEND_PUBLIC_URL } = process.env;
  if (!WFP_MERCHANT || !WFP_SECRET || !WFP_DOMAIN) return res.status(503).json({ message: "WayForPay is not configured" });
  const id = req.body?.order_id;
  if (!id) return res.status(400).json({ message: "order_id required" });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: [order] } = await query.graph({
    entity: "order", fields: ["id", "display_id", "metadata", "items.*", "shipping_address.phone"], filters: { id },
  });
  if (!order) return res.status(404).json({ message: "order not found" });
  if ((order.metadata as Record<string, unknown> | null)?.paid) return res.status(409).json({ message: "already paid" });

  const items = (order.items ?? []).map((i) => ({ name: String(i?.title), count: Number((i as { quantity?: unknown })?.quantity ?? (i as { detail?: { quantity?: unknown } })?.detail?.quantity ?? 1), price: Number(i?.unit_price) }));
  const fields = purchaseFields({
    merchant: WFP_MERCHANT, secret: WFP_SECRET, domain: WFP_DOMAIN,
    orderReference: `TL-${order.display_id}-${Date.now().toString(36)}`, // unique per attempt
    amount: items.reduce((s, i) => s + i.count * i.price, 0),
    items,
    returnUrl: `${STOREFRONT_URL ?? "http://localhost:3100"}/pay-return?order=TL-${order.display_id}`,
    serviceUrl: `${BACKEND_PUBLIC_URL ?? "http://localhost:9000"}/hooks/wayforpay`,
    clientPhone: order.shipping_address?.phone ?? undefined,
  });
  return res.json({ url: "https://secure.wayforpay.com/pay", fields });
}
