import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { OfficePlaqueConstructor } from "@/components/signage/OfficePlaqueConstructor";

export const generateMetadata = constructorMetadata("/vyvisky/ofisni-tablychky");

export default function OfisniTablychkyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <OfficePlaqueConstructor />
      <SiteFooter />
    </>
  );
}
