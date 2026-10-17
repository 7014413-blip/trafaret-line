import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { LayeredPlaqueConstructor } from "@/components/signage/LayeredPlaqueConstructor";

export const generateMetadata = constructorMetadata("/vyvisky/tablychky-poverkh");

export default function TablychkyPoverkhPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <LayeredPlaqueConstructor kind="floor" />
      <SiteFooter />
    </>
  );
}
