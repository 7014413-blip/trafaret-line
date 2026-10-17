// Receipt of a paid order: requested only by the caller that claimed it, a repeat gets the same
// receipt back, the result is stored, and the retry job re-sends the stored request of failed
// receipts.

import { issueOrderReceipt } from "../payments/issue-order-receipt";
import { MAX_RECEIPT_ATTEMPTS, retryDueReceipts } from "../payments/retry-receipts";
import type {
  FiscalReceiptRecord, FiscalReceiptRequest, FiscalReceiptStore, ReceiptClaim, ReceiptOutcome,
} from "../../types/fiscal-receipt";

const request: FiscalReceiptRequest = {
  orderNumber: "TL-77",
  payment: "card",
  lines: [{ title: "Трафарет «КАВА»", quantity: 2, unitPrice: 150 }],
};

/** In-memory stand-in for the fiscal_receipt table with the same claim rules. */
function memoryStore(): FiscalReceiptStore & { rows: Map<string, FiscalReceiptRecord> } {
  const rows = new Map<string, FiscalReceiptRecord>();
  return {
    rows,
    async claimReceipt(input): Promise<ReceiptClaim> {
      const row = rows.get(input.orderNumber);
      if (!row) {
        const id = `frcpt_${rows.size + 1}`;
        rows.set(input.orderNumber, {
          id, order_number: input.orderNumber, order_id: input.orderId, status: "pending", attempts: 1,
          request: input.request, fiscal_number: null, receipt_url: null, message: null, updated_at: new Date(),
        });
        return { claimed: true, id, attempts: 1 };
      }
      if (row.status !== "failed" && row.status !== "not_configured") {
        return { claimed: false, issued: row.status === "issued" ? { status: "issued", fiscalNumber: row.fiscal_number ?? undefined } : null };
      }
      row.status = "pending";
      row.attempts += 1;
      return { claimed: true, id: row.id, attempts: row.attempts };
    },
    async finishReceipt(id, outcome) {
      const row = [...rows.values()].find((r) => r.id === id)!;
      row.status = outcome.status;
      row.fiscal_number = outcome.fiscalNumber ?? null;
      row.message = outcome.message ?? null;
    },
    async listDueReceipts(maxAttempts) {
      return [...rows.values()].filter((r) => (r.status === "failed" || r.status === "not_configured") && r.attempts < maxAttempts);
    },
  };
}

describe("issueOrderReceipt", () => {
  it("requests the receipt once, stores the fiscal number and returns it on a repeat", async () => {
    const store = memoryStore();
    const send = jest.fn(async (): Promise<ReceiptOutcome> => ({ status: "issued", fiscalNumber: "FN-9" }));

    expect(await issueOrderReceipt(store, { orderId: "order_77", request }, send)).toEqual({ status: "issued", fiscalNumber: "FN-9" });
    // A repeated callback gets the receipt issued already, without a second request.
    expect(await issueOrderReceipt(store, { orderId: "order_77", request }, send)).toEqual({ status: "issued", fiscalNumber: "FN-9" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(store.rows.get("TL-77")).toMatchObject({ status: "issued", fiscal_number: "FN-9" });
  });

  it("marks the receipt failed when the request throws", async () => {
    const store = memoryStore();
    const outcome = await issueOrderReceipt(store, { orderId: "order_77", request }, async () => { throw new Error("socket hang up"); });
    expect(outcome).toEqual({ status: "failed", message: "socket hang up" });
    expect(store.rows.get("TL-77")).toMatchObject({ status: "failed", message: "socket hang up" });
  });
});

describe("retryDueReceipts", () => {
  it("re-sends the stored request of a failed receipt and reports the result to the order", async () => {
    const store = memoryStore();
    await issueOrderReceipt(store, { orderId: "order_77", request }, async () => ({ status: "failed", message: "HTTP 502" }));
    const send = jest.fn(async (): Promise<ReceiptOutcome> => ({ status: "issued", fiscalNumber: "FN-10" }));
    const saved: [string, ReceiptOutcome][] = [];

    const report = await retryDueReceipts(store, async (orderId, outcome) => { saved.push([orderId, outcome]); }, send);

    expect(report).toEqual({ issued: 1, failed: 0 });
    expect(send).toHaveBeenCalledWith(request);
    expect(saved).toEqual([["order_77", { status: "issued", fiscalNumber: "FN-10" }]]);
    expect(store.rows.get("TL-77")).toMatchObject({ status: "issued", attempts: 2 });
  });

  it("stops after the last allowed attempt", async () => {
    const store = memoryStore();
    const fail = async (): Promise<ReceiptOutcome> => ({ status: "failed", message: "HTTP 502" });
    await issueOrderReceipt(store, { orderId: "order_77", request }, fail);
    for (let run = 0; run < MAX_RECEIPT_ATTEMPTS + 2; run++) await retryDueReceipts(store, async () => undefined, fail);
    expect(store.rows.get("TL-77")?.attempts).toBe(MAX_RECEIPT_ATTEMPTS);
  });
});
