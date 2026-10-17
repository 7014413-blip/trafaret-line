// The fiscal_receipt table on a real PostgreSQL: the unique order number lets only one caller
// request the receipt of an order, also when two payment callbacks arrive at the same moment.

import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { FISCAL_RECEIPT_MODULE } from "../../src/modules/fiscal-receipt";
import type FiscalReceiptModuleService from "../../src/modules/fiscal-receipt/service";
import type { FiscalReceiptRequest } from "../../src/types/fiscal-receipt";

jest.setTimeout(60 * 1000);

const request = (orderNumber: string): FiscalReceiptRequest => ({
  orderNumber,
  payment: "card",
  lines: [{ title: "Трафарет «КАВА»", quantity: 1, unitPrice: 250 }],
});

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    const store = () => getContainer().resolve<FiscalReceiptModuleService>(FISCAL_RECEIPT_MODULE);

    describe("fiscal receipt claims", () => {
      it("gives the receipt of an order to one of two simultaneous callers", async () => {
        const input = { orderNumber: "TL-501", orderId: "order_501", request: request("TL-501") };
        const claims = await Promise.all([store().claimReceipt(input), store().claimReceipt(input)]);
        expect(claims.filter((c) => c.claimed)).toHaveLength(1);
      });

      it("never claims an issued receipt again and returns it instead", async () => {
        const input = { orderNumber: "TL-502", orderId: "order_502", request: request("TL-502") };
        const first = await store().claimReceipt(input);
        if (!first.claimed) throw new Error("first claim must succeed");
        await store().finishReceipt(first.id, { status: "issued", fiscalNumber: "FN-1", receiptUrl: "https://kasa.vchasno.ua/c/FN-1" });
        expect(await store().claimReceipt(input)).toEqual({
          claimed: false, issued: { status: "issued", fiscalNumber: "FN-1", receiptUrl: "https://kasa.vchasno.ua/c/FN-1" },
        });
        expect(await store().listDueReceipts(8)).not.toContainEqual(expect.objectContaining({ order_number: "TL-502" }));
      });

      it("lets a failed receipt be tried again and counts the attempts", async () => {
        const input = { orderNumber: "TL-503", orderId: "order_503", request: request("TL-503") };
        const first = await store().claimReceipt(input);
        if (!first.claimed) throw new Error("first claim must succeed");
        await store().finishReceipt(first.id, { status: "failed", message: "HTTP 502" });

        const due = await store().listDueReceipts(8);
        expect(due).toContainEqual(expect.objectContaining({ order_number: "TL-503", order_id: "order_503", status: "failed", request: request("TL-503") }));
        expect(await store().listDueReceipts(1)).not.toContainEqual(expect.objectContaining({ order_number: "TL-503" }));

        expect(await store().claimReceipt(input)).toEqual({ claimed: true, id: first.id, attempts: 2 });
        expect(await store().claimReceipt(input)).toEqual({ claimed: false, issued: null });
      });
    });
  },
});
