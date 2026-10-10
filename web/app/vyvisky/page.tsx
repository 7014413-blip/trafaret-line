import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { SignConstructor } from "@/components/signage/SignConstructor";

export const metadata: Metadata = pageMeta({
  title: "Вивіски з акрилу — конструктор з ціною одразу",
  description: "Двошарові вивіски і вказівники з акрилу: дзеркальний, кольоровий, глянцевий. Форма, розмір, напис, отвори — ціна одразу, виготовлення 3 робочі дні.",
  path: "/vyvisky",
});

export default function VyviskyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <SignConstructor />
      <SiteFooter />
    </>
  );
}
