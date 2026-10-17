import { constructorMetadata } from "@/components/layout/constructor-route";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { JoinedWordsConstructor } from "@/components/signage/JoinedWordsConstructor";

export const generateMetadata = constructorMetadata("/vyvisky/napysy-na-plantsi");

export default function NapysyNaPlantsiPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <JoinedWordsConstructor />
      <SiteFooter />
    </>
  );
}
