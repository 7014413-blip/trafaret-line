import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { InitialsConstructor } from "@/components/signage/InitialsConstructor";

export const metadata: Metadata = pageMeta({
  title: "Ініціали на весільний торт з акрилу — конструктор з ціною",
  description: "Ініціали молодят на торт: дві літери з роздільником, свій шрифт, розмір і колір, дзеркальний або кольоровий акрил. Окремими деталями або на планці зі шпажкою, ціна одразу.",
  path: "/konstruktor/inicialy-na-tort",
});

export default function InicialyNaTortPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <InitialsConstructor />
      <SiteFooter />
    </>
  );
}
