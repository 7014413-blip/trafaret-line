import { infoPageComponent, infoPageMetadata } from "@/components/layout/info-page-route";
import { ABOUT } from "@/data/pages/pro-nas";

export const generateMetadata = infoPageMetadata(ABOUT, "/pro-nas");

export default infoPageComponent(ABOUT);
