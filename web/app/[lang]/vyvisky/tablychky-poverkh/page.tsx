import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { LayeredPlaqueConstructor } from "@/components/signage/LayeredPlaqueConstructor";

export const metadata: Metadata = pageMeta({
  title: "Таблички поверхів «ПОВЕРХ 1» для будинку — конструктор, ціна одразу",
  description: "Обʼємні таблички поверху з акрилу: біла чи чорна основа, напис, номер і рамка із золотого чи срібного дзеркального акрилу. 13×18 см 360 ₴, набір на всі поверхи одразу.",
  path: "/vyvisky/tablychky-poverkh",
});

export default function TablychkyPoverkhPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <LayeredPlaqueConstructor kind="floor" />
      <SiteFooter />
    </>
  );
}
