import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { PointerSignConstructor } from "@/components/signage/PointerSignConstructor";

export const generateMetadata = constructorMetadata("/vyvisky/vkazivnyky");

export default function VkazivnykyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <PointerSignConstructor />
      <SiteFooter />
    </>
  );
}
