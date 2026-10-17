import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { Konstruktor } from "@/components/constructor/Konstruktor";

export const generateMetadata = constructorMetadata("/konstruktor");

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
