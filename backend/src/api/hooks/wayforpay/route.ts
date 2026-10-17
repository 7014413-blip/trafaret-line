// POST /hooks/wayforpay — WayForPay serviceUrl callback. Verifies the signature, marks
// the order as paid (metadata) on "Approved" when the amount matches, answers with a
// signed "accept" at once, then issues the fiscal receipt (Вчасно.Каса through the
// storefront route) and stores its number in the order metadata. The receipt is claimed in the
// fiscal_receipt table first, so two callbacks arriving together still give one receipt.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { callbackAnswer, verifyCallback, type WfpCallback } from "../../../lib/payments/wayforpay";
import { issueOrderReceipt } from "../../../lib/payments/issue-order-receipt";
import { saveReceiptToOrder } from "../../../lib/payments/save-receipt-to-order";
import { FISCAL_RECEIPT_MODULE } from "../../../modules/fiscal-receipt";
import type FiscalReceiptModuleService from "../../../modules/fiscal-receipt/service";

type OrderItem = { title?: string; quantity?: unknown; unit_price?: unknown };

/** WayForPay sends JSON in the body; some setups send it as the only form key. */
function readCallback(raw: unknown): WfpCallback {
  if (typeof raw === "string") return JSON.parse(raw);
  const keys = Object.keys(raw as object);
  if (keys.length === 1 && Object.values(raw as object)[0] === "") return JSON.parse(keys[0]);
  return raw as WfpCallback;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const secret = process.env.WFP_SECRET;
  if (!secret) return res.status(503).end();
  const callback = readCallback(req.body);
  if (!verifyCallback(secret, callback)) return res.status(400).json({ message: "bad signature" });

  const displayId = Number(String(callback.orderReference).split("-")[1]);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  // display_id is an integer column; the generated filter type only lists strings, the number is passed as is.
  const { data: [order] } = await query.graph({
    entity: "order", fields: ["id", "email", "metadata", "items.*", "shipping_address.phone"], filters: { display_id: displayId as unknown as string },
  });
  const items = (order?.items ?? []) as OrderItem[];
  const expected = items.reduce((sum, item) => sum + Number(item?.quantity ?? 1) * Number(item?.unit_price), 0);
  const approved = !!order && callback.transactionStatus === "Approved" && Number(callback.amount) === expected;
  const alreadyPaid = !!(order?.metadata as Record<string, unknown> | null)?.paid;

  const orders = req.scope.resolve(Modules.ORDER);
  if (approved && !alreadyPaid) {
    await orders.updateOrders(order.id, {
      metadata: { ...(order.metadata ?? {}), paid: true, paidVia: "wayforpay", wfpReference: callback.orderReference, paidAt: new Date().toISOString() },
    });
  }

  res.json(callbackAnswer(secret, callback.orderReference));

  if (!approved || alreadyPaid) return;
  const email = order.email && !order.email.endsWith("@phone.trafaret-line.com.ua") ? order.email : undefined;
  const receipt = await issueOrderReceipt(req.scope.resolve<FiscalReceiptModuleService>(FISCAL_RECEIPT_MODULE), {
    orderId: order.id,
    request: {
      orderNumber: `TL-${displayId}`,
      payment: "card",
      lines: items.map((item) => ({ title: String(item.title ?? "Трафарет"), quantity: Number(item.quantity ?? 1), unitPrice: Number(item.unit_price) })),
      paymentRef: { cardMask: callback.cardPan, authCode: callback.authCode, system: "WayForPay" },
      customer: { email, phone: (order as { shipping_address?: { phone?: string } }).shipping_address?.phone },
    },
  });
  if (receipt) await saveReceiptToOrder(req.scope, order.id, receipt);
}
