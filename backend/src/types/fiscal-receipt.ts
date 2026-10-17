// Fiscal receipts of paid orders (ТЗ: «чек ніколи не фіскалізується двічі»). One row per order
// number in the fiscal_receipt table (src/modules/fiscal-receipt); the unique key on the order
// number is what stops a second receipt, even when two payment callbacks arrive together.

/** pending: a receipt is being requested right now; issued: done; failed / not_configured: retried by the job. */
export type FiscalReceiptStatus = "pending" | "issued" | "failed" | "not_configured";

export interface ReceiptLine {
  title: string;
  quantity: number;
  unitPrice: number;
}

/** What the storefront route POST /api/vchasno-kasa/receipt receives; stored with the row for retries. */
export interface FiscalReceiptRequest {
  orderNumber: string;
  payment: "card" | "privat";
  lines: ReceiptLine[];
  paymentRef?: { rrn?: string; cardMask?: string; authCode?: string; system?: string };
  customer?: { email?: string; phone?: string };
}

export interface ReceiptOutcome {
  status: "issued" | "not_configured" | "failed";
  fiscalNumber?: string;
  receiptUrl?: string;
  message?: string;
}

/** A row of fiscal_receipt as the module returns it. */
export interface FiscalReceiptRecord {
  id: string;
  order_number: string;
  order_id: string;
  status: FiscalReceiptStatus;
  attempts: number;
  request: FiscalReceiptRequest;
  fiscal_number: string | null;
  receipt_url: string | null;
  message: string | null;
  updated_at: Date | string;
}

/**
 * Result of trying to take the receipt of an order: only the caller that got claimed=true may
 * request it. Otherwise issued is the receipt already fiscalised, or null while another caller
 * is requesting it right now.
 */
export type ReceiptClaim =
  | { claimed: true; id: string; attempts: number }
  | { claimed: false; issued: ReceiptOutcome | null };

/** The part of the module service the receipt functions use (tests pass a fake). */
export interface FiscalReceiptStore {
  claimReceipt(input: { orderNumber: string; orderId: string; request: FiscalReceiptRequest }): Promise<ReceiptClaim>;
  finishReceipt(id: string, outcome: ReceiptOutcome): Promise<void>;
  listDueReceipts(maxAttempts: number): Promise<FiscalReceiptRecord[]>;
}
