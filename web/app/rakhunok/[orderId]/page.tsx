// Printable B2B invoice for an order paid by invoice: /rakhunok/<order id>?t=<token>. The
// buyer gets the signed link after checkout; "Зберегти PDF" uses the browser's print to PDF.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildInvoice } from "@/lib/invoice/build-invoice";
import { formatMoney2 } from "@/lib/format";
import { ConfigError } from "@/services/config";
import { invoiceSeller } from "@/services/invoice-seller";
import { invoiceOrder } from "@/services/medusa-orders";
import { PrintButton } from "@/components/invoice/PrintButton";
import { verifyOrderLink } from "@/lib/security/order-link";

type Props = { params: Promise<{ orderId: string }>; searchParams: Promise<{ t?: string | string[] }> };

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Рахунок на оплату", robots: { index: false, follow: false } };

const date = (iso: string) => iso.split("-").reverse().join(".");

export default async function InvoicePage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const raw = (await searchParams).t;
  // Only the signed link from checkout opens the invoice (the buyer's requisites are on it).
  if (!verifyOrderLink(orderId, Array.isArray(raw) ? raw[0] : raw)) notFound();
  const order = await invoiceOrder(orderId);
  if (!order) notFound();

  let seller;
  try {
    seller = invoiceSeller();
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    return (
      <main className="mx-auto grid max-w-[640px] gap-3 px-4 py-14">
        <h1 className="m-0 text-2xl font-bold">Рахунок {order.number} готується</h1>
        <p className="m-0 text-[var(--muted)]">Менеджер надішле рахунок на пошту протягом робочого дня.</p>
      </main>
    );
  }

  const invoice = buildInvoice(order, seller);
  const buyer = invoice.buyer;
  return (
    <main className="mx-auto max-w-[820px] bg-white px-6 py-8 text-[#0f172a] print:p-0">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link href="/" className="text-sm underline">На сайт</Link>
        <PrintButton />
      </div>

      <h1 className="m-0 text-2xl font-bold">Рахунок на оплату № {invoice.number} від {date(invoice.date)}</h1>
      <p className="mt-1 mb-6 text-sm">Сплатити до {date(invoice.dueDate)}</p>

      <section className="mb-5 grid gap-1 text-[15px]">
        <b>Постачальник</b>
        <span>{invoice.seller.name}, РНОКПП {invoice.seller.code}</span>
        <span>{invoice.seller.address}</span>
        <span>IBAN {invoice.seller.iban}, {invoice.seller.bank}</span>
        <span>{invoice.seller.taxNote}. Тел. {invoice.seller.phone}, {invoice.seller.email}</span>
      </section>

      <section className="mb-6 grid gap-1 text-[15px]">
        <b>Покупець</b>
        <span>{buyer.name}, {buyer.form === "fop" ? "РНОКПП" : "ЄДРПОУ"} {buyer.code}</span>
        {buyer.address && <span>{buyer.address}</span>}
        {buyer.director && buyer.form === "company" && <span>Керівник: {buyer.director}</span>}
      </section>

      <table className="w-full border-collapse text-[14px]">
        <thead>
          <tr className="border-y border-[#0f172a] text-left">
            <th className="py-2 pr-2">№</th><th className="py-2 pr-2">Товар</th><th className="py-2 pr-2">Од.</th>
            <th className="py-2 pr-2 text-right">К-сть</th><th className="py-2 pr-2 text-right">Ціна, грн</th><th className="py-2 text-right">Сума, грн</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l) => (
            <tr key={l.position} className="border-b border-[#e2e8f0] align-top">
              <td className="py-2 pr-2">{l.position}</td><td className="py-2 pr-2">{l.title}</td><td className="py-2 pr-2">{l.unit}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{l.quantity}</td><td className="py-2 pr-2 text-right tabular-nums">{formatMoney2(l.price)}</td>
              <td className="py-2 text-right tabular-nums">{formatMoney2(l.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={5} className="pt-3 text-right font-bold">Разом:</td><td className="pt-3 text-right font-bold tabular-nums">{formatMoney2(invoice.total)}</td></tr>
          <tr><td colSpan={5} className="text-right">{invoice.vatNote}</td><td /></tr>
        </tfoot>
      </table>

      <p className="mt-5 text-[15px]">Всього на суму: <b>{invoice.totalInWords}</b>. {invoice.vatNote}.</p>
      <p className="mt-8 text-[15px]">Постачальник ____________________ {invoice.seller.name}</p>
    </main>
  );
}
