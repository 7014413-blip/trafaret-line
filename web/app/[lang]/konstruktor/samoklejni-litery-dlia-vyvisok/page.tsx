import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { StickLettersConstructor } from "@/components/signage/StickLettersConstructor";

export const generateMetadata = constructorMetadata("/konstruktor/samoklejni-litery-dlia-vyvisok");

export default function SamoklejniLiteryDliaVyvisokPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <StickLettersConstructor product="sign-letters" />
      <SiteFooter />
    </>
  );
}
