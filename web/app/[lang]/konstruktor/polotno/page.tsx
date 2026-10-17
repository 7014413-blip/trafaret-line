import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { FreeCanvasEditor } from "@/components/constructor/FreeCanvasEditor";

export const metadata: Metadata = pageMeta({
  title: "Вільне полотно: кілька написів і фігур на одному трафареті",
  description: "Розставте написи, коло, зірку, серце або рамку на одному аркуші. Перемички ставимо автоматично, тонкі місця підсвічуємо, ціна одразу.",
  path: "/konstruktor/polotno",
});

export default function FreeCanvasPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <FreeCanvasEditor />
      <SiteFooter />
    </>
  );
}
