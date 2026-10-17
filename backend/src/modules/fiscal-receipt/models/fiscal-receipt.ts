// fiscal_receipt: one row per paid order. The unique order number is the guarantee that a
// receipt is never fiscalised twice (types/fiscal-receipt.ts).

import { model } from "@medusajs/framework/utils";

const FiscalReceipt = model.define("fiscal_receipt", {
  id: model.id({ prefix: "frcpt" }).primaryKey(),
  order_number: model.text().unique(),
  order_id: model.text(),
  status: model.enum(["pending", "issued", "failed", "not_configured"]).default("pending"),
  attempts: model.number().default(1),
  request: model.json(),
  fiscal_number: model.text().nullable(),
  receipt_url: model.text().nullable(),
  message: model.text().nullable(),
});

export default FiscalReceipt;
