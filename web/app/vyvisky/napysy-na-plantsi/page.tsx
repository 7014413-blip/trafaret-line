import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { JoinedWordsConstructor } from "@/components/signage/JoinedWordsConstructor";

export const metadata: Metadata = pageMeta({
  title: "Написи на планці з акрилу — меню для кавʼярні, конструктор з ціною",
  description: "Слова з акрилу, де літери стоять на тонкій планці: кожне слово однією деталлю. Меню з цінами, назви зон, написи на стіну. Свій шрифт, колір і висота літер, ціна одразу.",
  path: "/vyvisky/napysy-na-plantsi",
});

export default function NapysyNaPlantsiPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <JoinedWordsConstructor />
      <SiteFooter />
    </>
  );
}
