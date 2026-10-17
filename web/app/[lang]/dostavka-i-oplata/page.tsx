import { infoPageComponent, infoPageMetadata } from "@/components/layout/info-page-route";
import { DELIVERY_PAGE } from "@/data/pages/dostavka-i-oplata";

export const generateMetadata = infoPageMetadata(DELIVERY_PAGE, "/dostavka-i-oplata");

export default infoPageComponent(DELIVERY_PAGE);
