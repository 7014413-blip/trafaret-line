// WayForPay helpers: purchase form fields and callback verification (HMAC-MD5).
// Docs: https://wiki.wayforpay.com/en/view/852102 (Purchase), serviceUrl callback.
// Credentials come from env: WFP_MERCHANT, WFP_SECRET, WFP_DOMAIN. Never from the browser.

import { createHmac } from "node:crypto";

const sign = (secret: string, parts: (string | number)[]) =>
  createHmac("md5", secret).update(parts.join(";"), "utf8").digest("hex");

export type WfpItem = { name: string; count: number; price: number };

export function purchaseFields(o: {
  merchant: string; secret: string; domain: string; orderReference: string; amount: number;
  items: WfpItem[]; returnUrl: string; serviceUrl: string; language?: "UA" | "RU" | "EN"; clientPhone?: string;
}) {
  const orderDate = Math.floor(Date.now() / 1000);
  const amount = o.amount.toFixed(2);
  const names = o.items.map((i) => i.name.slice(0, 255));
  const counts = o.items.map((i) => i.count);
  const prices = o.items.map((i) => i.price.toFixed(2));
  const merchantSignature = sign(o.secret, [o.merchant, o.domain, o.orderReference, orderDate, amount, "UAH", ...names, ...counts, ...prices]);
  return {
    merchantAccount: o.merchant, merchantAuthType: "SimpleSignature", merchantDomainName: o.domain,
    orderReference: o.orderReference, orderDate, amount, currency: "UAH",
    productName: names, productCount: counts, productPrice: prices,
    returnUrl: o.returnUrl, serviceUrl: o.serviceUrl, language: o.language ?? "UA",
    ...(o.clientPhone ? { clientPhone: o.clientPhone } : {}),
    merchantSignature,
  };
}

export type WfpCallback = {
  merchantAccount: string; orderReference: string; amount: number | string; currency: string;
  authCode: string; cardPan: string; transactionStatus: string; reasonCode: number | string; merchantSignature: string;
};

export function verifyCallback(secret: string, c: WfpCallback): boolean {
  const expected = sign(secret, [c.merchantAccount, c.orderReference, c.amount, c.currency, c.authCode, c.cardPan, c.transactionStatus, c.reasonCode]);
  return expected === c.merchantSignature;
}

export function callbackAnswer(secret: string, orderReference: string) {
  const time = Math.floor(Date.now() / 1000);
  return { orderReference, status: "accept", time, signature: sign(secret, [orderReference, "accept", time]) };
}
