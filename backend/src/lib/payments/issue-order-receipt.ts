// Issues the fiscal receipt of one paid order at most once. The order is first claimed in the
// fiscal_receipt table (unique order number): a caller that does not get the claim gets the
// receipt issued already, or null while another callback is requesting it right now.

import type { FiscalReceiptRequest, FiscalReceiptStore, ReceiptOutcome } from "../../types/fiscal-receipt";
import { requestFiscalReceipt } from "./fiscal-receipt";

export async function issueOrderReceipt(
  store: FiscalReceiptStore,
  input: { orderId: string; request: FiscalReceiptRequest },
  send: (request: FiscalReceiptRequest) => Promise<ReceiptOutcome> = requestFiscalReceipt,
): Promise<ReceiptOutcome | null> {
  const claim = await store.claimReceipt({ orderNumber: input.request.orderNumber, orderId: input.orderId, request: input.request });
  if (!claim.claimed) return claim.issued;

  let outcome: ReceiptOutcome;
  try {
    outcome = await send(input.request);
  } catch (error) {
    outcome = { status: "failed", message: (error as Error).message };
  }
  await store.finishReceipt(claim.id, outcome);
  return outcome;
}
