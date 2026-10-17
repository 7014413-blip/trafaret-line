// Every 15 minutes: receipts of paid orders that failed or got stuck are requested again
// (lib/payments/retry-receipts.ts); each order still gets one receipt at most.

import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { FISCAL_RECEIPT_MODULE } from "../modules/fiscal-receipt";
import type FiscalReceiptModuleService from "../modules/fiscal-receipt/service";
import { retryDueReceipts } from "../lib/payments/retry-receipts";
import { saveReceiptToOrder } from "../lib/payments/save-receipt-to-order";

export default async function retryFiscalReceiptsJob(container: MedusaContainer): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const store = container.resolve<FiscalReceiptModuleService>(FISCAL_RECEIPT_MODULE);
  const report = await retryDueReceipts(store, (orderId, outcome) => saveReceiptToOrder(container, orderId, outcome));
  if (report.issued || report.failed) logger.info(`Fiscal receipts retried: ${report.issued} issued, ${report.failed} still failing`);
}

export const config = {
  name: "retry-fiscal-receipts",
  schedule: "*/15 * * * *",
};
