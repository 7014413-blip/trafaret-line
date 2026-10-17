// Card orders: the purchase is reported when the buyer comes back from WayForPay with the
// payment approved, so the order is kept in this tab's sessionStorage until then.

import type { PendingPurchase } from "../../types/analytics";
import { readStored, writeStored } from "./browser-storage";

const KEY = "tl-pending-purchase";

export function savePendingPurchase(purchase: PendingPurchase): void {
  writeStored("session", KEY, JSON.stringify(purchase));
}

/** The saved order if the return is for it (by id or number); it is removed either way. */
export function takePendingPurchase(order: string): PendingPurchase | null {
  const raw = readStored("session", KEY);
  if (!raw) return null;
  writeStored("session", KEY, null);
  try {
    const purchase = JSON.parse(raw) as PendingPurchase;
    return order && (purchase.orderId === order || purchase.orderNumber === order) ? purchase : null;
  } catch {
    return null;
  }
}
