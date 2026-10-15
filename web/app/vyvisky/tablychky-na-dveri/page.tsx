import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { LayeredPlaqueConstructor } from "@/components/signage/LayeredPlaqueConstructor";

export const metadata: Metadata = pageMeta({
  title: "Таблички на двері з дзеркальною окантовкою — конструктор",
  description: "Табличка на двері кабінету чи салону: акрилова основа, золота чи срібна дзеркальна окантовка і обʼємні літери. Свій текст, шрифт і колір, ціна одразу.",
  path: "/vyvisky/tablychky-na-dveri",
});

export default function TablychkyNaDveriPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <LayeredPlaqueConstructor kind="door" />
      <SiteFooter />
    </>
  );
}
