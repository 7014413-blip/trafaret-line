// Tag ids from the environment. A value of the wrong shape is ignored, so a typo never puts a
// broken script on every page: GTM ids look like "GTM-ABC1234", Meta pixel ids are 15–16 digits.

import type { AnalyticsConfig } from "../../types/analytics";

const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/;
const META_PIXEL_ID = /^\d{10,20}$/;

export function analyticsConfig(gtm: string | undefined, pixel: string | undefined): AnalyticsConfig {
  const gtmId = gtm?.trim().toUpperCase() ?? "";
  const metaPixelId = pixel?.trim() ?? "";
  return {
    gtmId: GTM_ID.test(gtmId) ? gtmId : null,
    metaPixelId: META_PIXEL_ID.test(metaPixelId) ? metaPixelId : null,
  };
}

/** Ids of this build (NEXT_PUBLIC_ values are inlined at build time). */
export function siteAnalyticsConfig(): AnalyticsConfig {
  return analyticsConfig(process.env.NEXT_PUBLIC_GTM_ID, process.env.NEXT_PUBLIC_META_PIXEL_ID);
}
