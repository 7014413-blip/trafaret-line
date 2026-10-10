import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { PointerSignConstructor } from "@/components/signage/PointerSignConstructor";

export const metadata: Metadata = pageMeta({
  title: "Табличка-вказівник зі стрілкою — конструктор, ціна одразу",
  description: "Обʼємна двошарова табличка-стрілка з вашим написом і логотипом: 25×10 см від 450 ₴, свій шрифт, колір основи й напису, напрямок вліво чи вправо. Виготовлення 3 робочі дні.",
  path: "/vyvisky/vkazivnyky",
});

export default function VkazivnykyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <PointerSignConstructor />
      <SiteFooter />
    </>
  );
}
