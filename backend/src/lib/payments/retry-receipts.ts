// Second chance for receipts that did not go through: failed ones (Вчасно.Каса or the storefront
// was down), not configured ones (keys added later) and ones left «pending» by a process that
// died. Each is claimed again in the table first, so a retry never races a payment callback.

import type { FiscalReceiptRequest, FiscalReceiptStore, ReceiptOutcome } from "../../types/fiscal-receipt";
import { issueOrderReceipt } from "./issue-order-receipt";
import { requestFiscalReceipt } from "./fiscal-receipt";

/** After this many tries a receipt waits for a person (it stays «failed» in the table and the order). */
export const MAX_RECEIPT_ATTEMPTS = 8;

export interface RetryReport {
  issued: number;
  failed: number;
}

export async function retryDueReceipts(
  store: FiscalReceiptStore,
  onResult: (orderId: string, outcome: ReceiptOutcome) => Promise<void>,
  send: (request: FiscalReceiptRequest) => Promise<ReceiptOutcome> = requestFiscalReceipt,
): Promise<RetryReport> {
  const report: RetryReport = { issued: 0, failed: 0 };
  for (const row of await store.listDueReceipts(MAX_RECEIPT_ATTEMPTS)) {
    const outcome = await issueOrderReceipt(store, { orderId: row.order_id, request: row.request }, send);
    if (!outcome) continue;
    await onResult(row.order_id, outcome);
    if (outcome.status === "issued") report.issued += 1;
    else report.failed += 1;
  }
  return report;
}
