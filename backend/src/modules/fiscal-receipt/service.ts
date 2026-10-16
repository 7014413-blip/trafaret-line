// Fiscal receipts module service. claimReceipt is a single INSERT … ON CONFLICT on the unique
// order number, so of two callers working on the same order only one gets the receipt: the
// other gets claimed=false (with the issued receipt, if there is one) and must not call Вчасно.Каса. A failed receipt, or one stuck in
// «pending» for STALE_MINUTES (the process died mid-request), can be claimed again.

import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { generateEntityId, InjectManager, MedusaContext, MedusaService } from "@medusajs/framework/utils";
import FiscalReceipt from "./models/fiscal-receipt";
import type {
  FiscalReceiptRecord, FiscalReceiptRequest, FiscalReceiptStore, ReceiptClaim, ReceiptOutcome,
} from "../../types/fiscal-receipt";

/** A «pending» row older than this is taken as abandoned and may be claimed again. */
export const STALE_MINUTES = 10;

const CLAIM_SQL = `
INSERT INTO fiscal_receipt (id, order_number, order_id, status, attempts, request, created_at, updated_at)
VALUES (?, ?, ?, 'pending', 1, ?::jsonb, now(), now())
ON CONFLICT (order_number) WHERE deleted_at IS NULL DO UPDATE
  SET status = 'pending', attempts = fiscal_receipt.attempts + 1, message = NULL, updated_at = now()
  WHERE fiscal_receipt.status IN ('failed', 'not_configured')
     OR (fiscal_receipt.status = 'pending' AND fiscal_receipt.updated_at < now() - make_interval(mins => ?))
RETURNING id, attempts`;

const DUE_SQL = `
SELECT id, order_number, order_id, status, attempts, request, fiscal_number, receipt_url, message, updated_at
FROM fiscal_receipt
WHERE deleted_at IS NULL AND attempts < ?
  AND (status IN ('failed', 'not_configured')
       OR (status = 'pending' AND updated_at < now() - make_interval(mins => ?)))
ORDER BY created_at
LIMIT 50`;

class FiscalReceiptModuleService extends MedusaService({ FiscalReceipt }) implements FiscalReceiptStore {
  @InjectManager()
  async claimReceipt(
    input: { orderNumber: string; orderId: string; request: FiscalReceiptRequest },
    @MedusaContext() sharedContext: Context<EntityManager> = {},
  ): Promise<ReceiptClaim> {
    const rows = await sharedContext.manager!.execute<{ id: string; attempts: number }[]>(CLAIM_SQL, [
      generateEntityId(undefined, "frcpt"), input.orderNumber, input.orderId, JSON.stringify(input.request), STALE_MINUTES,
    ]);
    const row = rows[0];
    if (row) return { claimed: true, id: row.id, attempts: Number(row.attempts) };
    const [held] = await sharedContext.manager!.execute<Pick<FiscalReceiptRecord, "status" | "fiscal_number" | "receipt_url">[]>(
      "SELECT status, fiscal_number, receipt_url FROM fiscal_receipt WHERE order_number = ? AND deleted_at IS NULL",
      [input.orderNumber],
    );
    const issued: ReceiptOutcome | null = held?.status === "issued"
      ? { status: "issued", fiscalNumber: held.fiscal_number ?? undefined, receiptUrl: held.receipt_url ?? undefined }
      : null;
    return { claimed: false, issued };
  }

  @InjectManager()
  async finishReceipt(id: string, outcome: ReceiptOutcome, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<void> {
    await sharedContext.manager!.execute(
      "UPDATE fiscal_receipt SET status = ?, fiscal_number = ?, receipt_url = ?, message = ?, updated_at = now() WHERE id = ?",
      [outcome.status, outcome.fiscalNumber ?? null, outcome.receiptUrl ?? null, outcome.message ?? null, id],
    );
  }

  @InjectManager()
  async listDueReceipts(maxAttempts: number, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<FiscalReceiptRecord[]> {
    return sharedContext.manager!.execute<FiscalReceiptRecord[]>(DUE_SQL, [maxAttempts, STALE_MINUTES]);
  }
}

export default FiscalReceiptModuleService;
