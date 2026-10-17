import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { LayeredPlaqueConstructor } from "@/components/signage/LayeredPlaqueConstructor";

export const metadata: Metadata = pageMeta({
  title: "Номерки на двері з двох шарів акрилу — конструктор, від 65 ₴",
  description: "Номерок для кабінету, квартири чи столика: два шари акрилу зі зсувом, номер вирізаний у лицьовому шарі, клейова основа. 8×8 см 65 ₴, набір номерів одразу.",
  path: "/vyvisky/nomerky",
});

export default function NomerkyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <LayeredPlaqueConstructor kind="number" />
      <SiteFooter />
    </>
  );
}
