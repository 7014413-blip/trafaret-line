// Copies the receipt result into the order metadata, where the admin and «Простий кабінет»
// show it (receiptStatus, receiptNumber, receiptUrl, receiptMessage). The metadata is re-read
// first: the payment callback has just written paid/paidAt into it.

import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { ReceiptOutcome } from "../../types/fiscal-receipt";

export async function saveReceiptToOrder(container: MedusaContainer, orderId: string, receipt: ReceiptOutcome): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const orders = container.resolve(Modules.ORDER);
  const { data: [fresh] } = await query.graph({ entity: "order", fields: ["id", "metadata"], filters: { id: orderId } });
  if (!fresh) return;
  await orders.updateOrders(orderId, {
    metadata: {
      ...(fresh.metadata ?? {}),
      receiptStatus: receipt.status,
      receiptNumber: receipt.fiscalNumber ?? null,
      receiptUrl: receipt.receiptUrl ?? null,
      receiptMessage: receipt.message ?? null,
    },
  });
}
