import { infoPageComponent, infoPageMetadata } from "@/components/layout/info-page-route";
import { RETURNS_PAGE } from "@/data/pages/povernennia";

export const generateMetadata = infoPageMetadata(RETURNS_PAGE, "/povernennia");

export default infoPageComponent(RETURNS_PAGE);
