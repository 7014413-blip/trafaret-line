"use client";

// Thank-you page after WayForPay: a card order counts as a purchase only when the payment is
// approved; the order saved before the payment page is sent once and removed.

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import { takePendingPurchase } from "@/lib/client/pending-purchase";

export function PurchaseOnReturn({ order, approved }: { order: string; approved: boolean }) {
  useEffect(() => {
    const purchase = takePendingPurchase(order);
    if (!purchase || !approved) return;
    trackEvent("purchase", { transaction_id: purchase.orderNumber, value: purchase.value, payment_type: purchase.paymentType, items: purchase.items });
  }, [order, approved]);
  return null;
}
