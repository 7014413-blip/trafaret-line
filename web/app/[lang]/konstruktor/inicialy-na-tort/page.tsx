import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { InitialsConstructor } from "@/components/signage/InitialsConstructor";

export const generateMetadata = constructorMetadata("/konstruktor/inicialy-na-tort");

export default function InicialyNaTortPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <InitialsConstructor />
      <SiteFooter />
    </>
  );
}
