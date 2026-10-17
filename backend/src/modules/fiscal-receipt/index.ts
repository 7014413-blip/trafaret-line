// Fiscal receipts of paid orders: one row per order number (types/fiscal-receipt.ts).

import { Module } from "@medusajs/framework/utils";
import FiscalReceiptModuleService from "./service";

export const FISCAL_RECEIPT_MODULE = "fiscalReceipt";

export default Module(FISCAL_RECEIPT_MODULE, {
  service: FiscalReceiptModuleService,
});
