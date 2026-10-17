// Stage of an order as the buyer sees it in «Мої замовлення». The parcel number comes from the
// order's "ttn" field (the manager types it in the admin) or from a fulfillment label.

import type { AccountOrderStage } from "../../shared/types/account";
import type { AccountOrderRecord } from "../../types/account";

export interface OrderStage {
  stage: AccountOrderStage;
  statusText: string;
  ttn: string | null;
}

const TEXT: Record<AccountOrderStage, string> = {
  accepted: "Прийнято, виготовляємо",
  awaiting_payment: "Чекає на оплату",
  paid: "Оплачено, виготовляємо",
  shipped: "Відправлено",
  cancelled: "Скасовано",
};

function parcelNumber(order: AccountOrderRecord): string | null {
  const typed = order.metadata?.ttn;
  if (typeof typed === "string" && /^\d[\d\s]{8,24}$/.test(typed.trim())) return typed.replace(/\s/g, "");
  for (const fulfillment of order.fulfillments ?? []) {
    if (fulfillment.canceled_at) continue;
    const label = fulfillment.labels?.find((l) => l.tracking_number?.trim());
    if (label?.tracking_number) return label.tracking_number.trim();
  }
  return null;
}

export function orderStage(order: AccountOrderRecord): OrderStage {
  const ttn = parcelNumber(order);
  if (order.status === "canceled") return { stage: "cancelled", statusText: TEXT.cancelled, ttn: null };
  const shipped = !!ttn || (order.fulfillments ?? []).some((f) => !f.canceled_at && f.shipped_at);
  if (shipped) return { stage: "shipped", statusText: TEXT.shipped, ttn };
  if (order.metadata?.paid === true) return { stage: "paid", statusText: TEXT.paid, ttn: null };
  const payment = order.metadata?.payment;
  if (payment === "card") return { stage: "awaiting_payment", statusText: `${TEXT.awaiting_payment} карткою`, ttn: null };
  if (payment === "invoice") return { stage: "awaiting_payment", statusText: `${TEXT.awaiting_payment} за рахунком`, ttn: null };
  return { stage: "accepted", statusText: TEXT.accepted, ttn: null };
}
