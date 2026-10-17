import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { BusinessSignConstructor } from "@/components/signage/BusinessSignConstructor";

export const generateMetadata = constructorMetadata("/vyvisky");

export default function VyviskyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <BusinessSignConstructor />
      <SiteFooter />
    </>
  );
}
