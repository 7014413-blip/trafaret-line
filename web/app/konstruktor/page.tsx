import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { Konstruktor } from "@/components/constructor/Konstruktor";

export const metadata: Metadata = pageMeta({
  title: "Свій напис на трафареті — конструктор з превʼю і ціною",
  description: "Впишіть текст, оберіть шрифт, розмір і матеріал. Перемички в літерах ставимо автоматично, ціна одразу. Виготовлення 3 робочі дні.",
  path: "/konstruktor",
});

export default function KonstruktorPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <Konstruktor />
      <SiteFooter />
    </>
  );
}
