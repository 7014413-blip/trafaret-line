import type { Metadata } from "next";
import Link from "@/components/i18n/LocaleLink";
import { SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { PurchaseOnReturn } from "@/components/analytics/PurchaseOnReturn";
import { CHECKOUT } from "@/lib/i18n/dictionaries/checkout";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import type { LangParams } from "@/types/i18n";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const t = tr(CHECKOUT, localeOf((await params).lang));
  return { title: t.thanksMetaTitle, robots: { index: false, follow: false } };
}

export default async function ThankYou({ params, searchParams }: { params: Promise<LangParams>; searchParams: Promise<{ order?: string; pay?: string }> }) {
  const locale = localeOf((await params).lang);
  const t = tr(CHECKOUT, locale);
  const { order, pay } = await searchParams;
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <main className="mx-auto grid max-w-[640px] justify-items-start gap-3 px-4 py-14">
        <h1 className="m-0 font-[family-name:var(--font-display)] text-3xl font-bold">{order ? t.thanksOrder(order) : t.thanks}</h1>
        <p className="m-0 text-lg"><b>{formatDispatch(estimateDispatchDate(new Date()), locale)}</b>. {t.ttnNote}</p>
        {pay === "Approved" ? <p className="m-0 font-semibold text-[var(--ok)]">{t.paymentReceived}</p> : <p className="m-0 text-[var(--muted)]">{pay ? t.cardFailed : ""}{t.orderSaved}</p>}
        {order && <PurchaseOnReturn order={order} approved={pay === "Approved"} />}
        <Link href="/" className="mt-2 rounded-full bg-[var(--buy)] px-6 py-3 font-bold text-[var(--buy-fg)]">{t.toHome}</Link>
      </main>
      <SiteFooter />
    </>
  );
}
