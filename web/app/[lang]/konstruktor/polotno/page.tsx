import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { FreeCanvasEditor } from "@/components/constructor/FreeCanvasEditor";

export const generateMetadata = constructorMetadata("/konstruktor/polotno");

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
