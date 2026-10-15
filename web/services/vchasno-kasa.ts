// Вчасно.Каса (PRRO) client: POST https://kasa.vchasno.ua/api/v3/fiscal/execute,
// header "Authorization: <cash register token>" (cabinet → cash register settings → Token).
// The fiscal key must be added in the cabinet (tab «Ключі») before receipts can be issued.
//
// The seller is ФОП 2nd group without VAT: tax group VCHASNO_TAXGRP, by default the receipt tax
// group of data/knowledge_base/rules_fop.json ("2" = «Без ПДВ»).
// Online card payments use pay type 16 (internet acquiring), LiqPay / Privat24 type 17.
// Cash on delivery is fiscalised by the carrier (NovaPay), not here.
// Every request carries a unique tag: repeating the same tag never creates a second
// receipt, so a retry after a timeout is always safe.

import "server-only";
import type {
  FiscalReceiptResult, ReceiptRequestBody, ShiftAction, VchasnoPayType, VchasnoReceipt, VchasnoRequest, VchasnoResponse, VchasnoTask,
} from "../types/integrations";
import { SELLER } from "../lib/knowledge-base/seller-rules";
import { envNumber, envOr, requireEnv, UpstreamError } from "./config";
import { fetchJson } from "./http";

const ENDPOINT = "https://kasa.vchasno.ua/api/v3/fiscal/execute";

/** res_action = 1 or 2: retry the same tag. 3: stop, a person has to look. */
const RETRY_ACTIONS = new Set([1, 2]);

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Only characters Вчасно.Каса accepts in text fields; everything else becomes a space. */
export function cleanText(value: string, max = 128): string {
  const allowed = /[A-Za-zА-Яа-яЁёІіЇїҐґЄє0-9 !.,"№;:?\\*()<>|/@#$%^\-_+=~''&{}[\]®©«»°±‘’“”–•—™„‰‹›]/u;
  return [...value].map((ch) => (allowed.test(ch) ? ch : " ")).join("").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Sends one fiscal task, retrying collisions and temporary tax-service errors with the same tag. */
export async function execute(request: VchasnoRequest, attempts = 3): Promise<VchasnoResponse> {
  const { VCHASNO_KASA_TOKEN } = requireEnv("vchasno-kasa", ["VCHASNO_KASA_TOKEN"]);
  const body: VchasnoRequest = { source: "trafaret-line", ...request, tag: request.tag ?? crypto.randomUUID() };
  let last: VchasnoResponse | null = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const { status, data } = await fetchJson<VchasnoResponse>("vchasno-kasa", ENDPOINT, {
      body,
      headers: { authorization: VCHASNO_KASA_TOKEN },
      timeoutMs: 25_000,
    });
    if (status === 401) throw new UpstreamError("vchasno-kasa", "Вчасно.Каса: wrong cash register token", 401);
    if (status >= 500) {
      if (attempt < attempts) continue;
      throw new UpstreamError("vchasno-kasa", `Вчасно.Каса: HTTP ${status}`, status);
    }
    last = data;
    if (data.res === 0 && data.res_action === 0) return data;
    if (!RETRY_ACTIONS.has(data.res_action) || attempt === attempts) break;
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
  }
  throw new UpstreamError("vchasno-kasa", `Вчасно.Каса: ${last?.errortxt || "error"} (res ${last?.res}, action ${last?.res_action})`, 200, {
    res: last?.res, res_action: last?.res_action, error_extra: last?.error_extra, tag: body.tag,
  });
}

function payTypeFor(payment: ReceiptRequestBody["payment"]): VchasnoPayType {
  return payment === "privat" ? 17 : 16;
}

/** Builds the sale receipt; the sum is recomputed from the lines (kopecks). */
export function buildSaleReceipt(input: ReceiptRequestBody, taxgrp: number | string): VchasnoReceipt {
  const rows = input.lines.map((line) => ({
    code: line.code ? cleanText(line.code, 32) : undefined,
    name: cleanText(line.title, 128),
    cnt: Math.round(line.quantity * 1000) / 1000,
    price: round2(line.unitPrice),
    disc: 0,
    taxgrp,
  }));
  const sum = round2(rows.reduce((s, r) => s + round2(r.cnt * r.price), 0));
  return {
    sum,
    round: 0,
    comment_down: cleanText(`Замовлення ${input.orderNumber}. Дякуємо!`),
    rows,
    pays: [{
      type: payTypeFor(input.payment),
      sum,
      paysys: input.paymentRef?.system ? cleanText(input.paymentRef.system, 32) : undefined,
      rrn: input.paymentRef?.rrn,
      cardmask: input.paymentRef?.cardMask,
      auth_code: input.paymentRef?.authCode,
    }],
  };
}

/** Issues the sale receipt for a paid order. The tag is derived from the order number, so a repeat call returns the same receipt. */
export async function issueSaleReceipt(input: ReceiptRequestBody): Promise<FiscalReceiptResult> {
  const taxgrp = envOr("VCHASNO_TAXGRP", SELLER.receiptTaxGroup);
  const tag = `tl-${input.orderNumber}-sale`;
  const response = await execute({
    tag,
    userinfo: input.customer?.email || input.customer?.phone ? { email: input.customer?.email, phone: input.customer?.phone } : undefined,
    fiscal: { task: 1, cashier: envOr("VCHASNO_CASHIER", "Trafaret Line"), receipt: buildSaleReceipt(input, Number.isNaN(Number(taxgrp)) ? taxgrp : Number(taxgrp)) },
  }, envNumber("VCHASNO_ATTEMPTS", 3));
  const code = response.info?.doccode;
  if (!code) throw new UpstreamError("vchasno-kasa", "Вчасно.Каса: no fiscal number in the answer", 200, response);
  return { tag: response.tag, fiscalNumber: code, receiptUrl: response.info?.qr ?? `https://kasa.vchasno.ua/c/${code}`, offline: !!response.info?.isoffline };
}

const SHIFT_TASKS: Record<ShiftAction, VchasnoTask> = { open: 0, x_report: 10, close: 11, status: 18 };

/** Opens / closes the shift, X report or PRRO status. */
export async function shift(action: ShiftAction): Promise<VchasnoResponse> {
  return execute({ fiscal: { task: SHIFT_TASKS[action], cashier: envOr("VCHASNO_CASHIER", "Trafaret Line") } });
}
