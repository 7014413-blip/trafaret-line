import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { BusinessSignConstructor } from "@/components/signage/BusinessSignConstructor";

export const metadata: Metadata = pageMeta({
  title: "Вивіска з логотипом з акрилу — конструктор з ціною одразу",
  description: "Двошарові вивіски з акрилу для салону, кавʼярні, офісу: ваш логотип, напис, дзеркальна рамка, кругла чи прямокутна форма, самоклейка або тримачі. Ціна одразу, виготовлення 3 робочі дні.",
  path: "/vyvisky",
});

export default function VyviskyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <BusinessSignConstructor />
      <SiteFooter />
    </>
  );
}
