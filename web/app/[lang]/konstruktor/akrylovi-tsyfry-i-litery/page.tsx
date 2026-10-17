import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { StickLettersConstructor } from "@/components/signage/StickLettersConstructor";

export const generateMetadata = constructorMetadata("/konstruktor/akrylovi-tsyfry-i-litery");

export default function AkryloviTsyfryILiteryPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <StickLettersConstructor product="chars" />
      <SiteFooter />
    </>
  );
}
