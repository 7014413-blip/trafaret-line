import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { BlanksConfigurator } from "@/components/blanks/BlanksConfigurator";

export const metadata: Metadata = pageMeta({
  title: "Заготовки з акрилу, дзеркального пластику і PET у ваш розмір",
  description: "Кола, квадрати, серця, зірки, арки та інші форми з прозорого, кольорового і дзеркального акрилу, підкладки під торт з PET і полістиролу. Свій розмір, ціна за штуку одразу, опт від 10 шт.",
  path: "/zahotovky",
});

export default function ZahotovkyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <BlanksConfigurator />
      <SiteFooter />
    </>
  );
}
