import type { Metadata } from "next";
import { SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { Checkout } from "@/components/checkout/Checkout";
import { CHECKOUT } from "@/lib/i18n/dictionaries/checkout";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import type { LangParams } from "@/types/i18n";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const t = tr(CHECKOUT, localeOf((await params).lang));
  return { title: t.metaTitle, robots: { index: false, follow: false } };
}

export default function CheckoutPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <Checkout />
      <SiteFooter />
    </>
  );
}
