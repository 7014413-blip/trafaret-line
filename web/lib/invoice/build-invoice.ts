// B2B invoice (рахунок на оплату) from an order: seller requisites from the server
// environment, buyer from the checkout (Opendatabot or typed in), lines and total from
// Medusa. The seller is ФОП 2nd group, so the invoice always says «Без ПДВ».

import type { B2BInvoice, InvoiceLine, InvoiceOrder, InvoiceSeller } from "../../types/invoice";
import { amountInWords } from "./amount-in-words";

/** Days the buyer has to pay. */
export const INVOICE_PAYMENT_DAYS = 5;

const round2 = (v: number) => Math.round(v * 100) / 100;

/** "YYYY-MM-DD" in the Kyiv calendar. */
export function kyivDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function buildInvoice(order: InvoiceOrder, seller: InvoiceSeller): B2BInvoice {
  const lines: InvoiceLine[] = order.lines.map((line, i) => ({
    position: i + 1,
    title: line.title,
    unit: "шт.",
    quantity: line.quantity,
    price: round2(line.unitPrice),
    amount: round2(line.unitPrice * line.quantity),
  }));
  const total = round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const created = new Date(order.createdAt);
  const due = new Date(created.getTime() + INVOICE_PAYMENT_DAYS * 24 * 60 * 60 * 1000);
  return {
    number: order.number,
    date: kyivDate(created),
    dueDate: kyivDate(due),
    orderNumber: order.number,
    seller,
    buyer: order.company,
    lines,
    total,
    totalInWords: amountInWords(total),
    vatNote: "Без ПДВ",
  };
}
