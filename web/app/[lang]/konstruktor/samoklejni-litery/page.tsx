import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { StickLettersConstructor } from "@/components/signage/StickLettersConstructor";

export const metadata: Metadata = pageMeta({
  title: "Самоклейні літери з акрилу для коробки з листівками — конструктор з ціною",
  description: "Обʼємні літери з акрилу 3 мм зі скотчем на звороті: напис на весільну коробку для листівок, подарунок чи стіл. Свій текст і шрифт для кожного рядка, злиті або окремі літери, картонний трафарет у ціні.",
  path: "/konstruktor/samoklejni-litery",
});

export default function SamoklejniLiteryPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <StickLettersConstructor />
      <SiteFooter />
    </>
  );
}
