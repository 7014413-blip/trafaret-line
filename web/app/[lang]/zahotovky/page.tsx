import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { BlanksConfigurator } from "@/components/blanks/BlanksConfigurator";

export const generateMetadata = constructorMetadata("/zahotovky");

export default function ZahotovkyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <BlanksConfigurator />
      <SiteFooter />
    </>
  );
}
