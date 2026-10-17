import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { LayeredPlaqueConstructor } from "@/components/signage/LayeredPlaqueConstructor";

export const generateMetadata = constructorMetadata("/vyvisky/tablychky-na-dveri");

export default function TablychkyNaDveriPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <LayeredPlaqueConstructor kind="door" />
      <SiteFooter />
    </>
  );
}
