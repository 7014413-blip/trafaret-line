import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { StickLettersConstructor } from "@/components/signage/StickLettersConstructor";

export const metadata: Metadata = pageMeta({
  title: "Самоклейні літери з акрилу для вивісок і написів — конструктор з ціною",
  description: "Окремі великі й малі літери з акрилу 3 мм зі скотчем на звороті, від 2 до 20 см: написи на вітрину, стіну, двері, рекламу. Чорні, білі, дзеркальні золото, срібло, рожеве золото. Ціна кожної літери одразу.",
  path: "/konstruktor/samoklejni-litery-dlia-vyvisok",
});

export default function SamoklejniLiteryDliaVyvisokPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <StickLettersConstructor product="sign-letters" />
      <SiteFooter />
    </>
  );
}
