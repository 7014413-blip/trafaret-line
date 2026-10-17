// Starts WayForPay card payment for an order that already exists in Medusa: the server
// (POST /store/tl-pay/wayforpay) signs the payment fields, the browser posts them to
// WayForPay. Returns false when the server could not prepare the payment, so the page can
// show the error and offer a retry instead of a "thank you" without payment. The page
// language goes along, so the payment page and the return to the site speak it too.

import type { Locale } from "../../types/customizer";

interface WayForPayForm {
  url: string;
  fields: Record<string, unknown>;
}

/** Signed WayForPay form for the order, or null when the payment cannot start. */
export async function prepareWayForPay(orderId: string, locale: Locale = "uk"): Promise<WayForPayForm | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/tl-pay/wayforpay`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PK ?? "" },
      body: JSON.stringify({ order_id: orderId, lang: locale }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<WayForPayForm>;
    if (typeof data.url !== "string" || !data.fields || typeof data.fields !== "object") return null;
    return { url: data.url, fields: data.fields };
  } catch {
    return null;
  }
}

/** Posts the signed fields to WayForPay; the browser leaves the site. */
export function submitWayForPay(form: WayForPayForm): void {
  const element = document.createElement("form");
  element.method = "POST";
  element.action = form.url;
  element.acceptCharset = "utf-8";
  for (const [name, value] of Object.entries(form.fields)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = Array.isArray(value) ? `${name}[]` : name;
      input.value = String(item);
      element.appendChild(input);
    }
  }
  document.body.appendChild(element);
  element.submit();
}

/** Prepares and starts the payment; false when it could not start. */
export async function startWayForPay(orderId: string, locale: Locale = "uk"): Promise<boolean> {
  const form = await prepareWayForPay(orderId, locale);
  if (!form) return false;
  submitWayForPay(form);
  return true;
}
