import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { StickLettersConstructor } from "@/components/signage/StickLettersConstructor";

export const metadata: Metadata = pageMeta({
  title: "Акрилові цифри і літери від 2 до 80 см — конструктор з ціною",
  description: "Окремі цифри і літери з акрилу 3 мм: номер будинку, квартири, дата, ініціали, декор. Висота від 2 до 80 см, будь-який колір і шрифт, зі скотчем або без. Ціна одразу.",
  path: "/konstruktor/akrylovi-tsyfry-i-litery",
});

export default function AkryloviTsyfryILiteryPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <StickLettersConstructor product="chars" />
      <SiteFooter />
    </>
  );
}
