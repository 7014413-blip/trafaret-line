import type { Metadata } from "next";
import { SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { Checkout } from "@/components/checkout/Checkout";

export const metadata: Metadata = { title: "Оформлення замовлення", robots: { index: false, follow: false } };

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
