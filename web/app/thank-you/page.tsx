import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";

export const metadata: Metadata = { title: "Дякуємо за замовлення", robots: { index: false, follow: false } };

export default async function ThankYou({ searchParams }: { searchParams: Promise<{ order?: string; pay?: string }> }) {
  const { order, pay } = await searchParams;
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <main className="mx-auto grid max-w-[640px] justify-items-start gap-3 px-4 py-14">
        <h1 className="m-0 font-[family-name:var(--font-display)] text-3xl font-bold">Дякуємо!{order ? ` Замовлення ${order}` : ""}</h1>
        <p className="m-0 text-lg"><b>{formatDispatch(estimateDispatchDate(new Date()))}</b>. Номер ТТН надішлемо у Viber або Telegram.</p>
        {pay === "Approved" ? <p className="m-0 font-semibold text-[var(--ok)]">Оплату отримано.</p> : <p className="m-0 text-[var(--muted)]">{pay ? "Оплата карткою не пройшла. " : ""}Замовлення збережене: ми звʼяжемося з вами і допоможемо оплатити іншим способом.</p>}
        <Link href="/" className="mt-2 rounded-full bg-[var(--buy)] px-6 py-3 font-bold text-[var(--buy-fg)]">На головну</Link>
      </main>
      <SiteFooter />
    </>
  );
}
