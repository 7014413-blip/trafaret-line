// Tag scripts of the site (plan step 9): Google Tag Manager (GA4, Google Ads) behind the
// Consent Mode v2 default, and the Meta pixel. Nothing is rendered when their ids are not set.

import Script from "next/script";
import { siteAnalyticsConfig } from "@/lib/analytics/analytics-config";
import { consentDefaultScript, gtmScript, metaPixelScript } from "@/lib/analytics/tag-scripts";

export function AnalyticsScripts() {
  const { gtmId, metaPixelId } = siteAnalyticsConfig();
  return (
    <>
      {gtmId && (
        <>
          {/* Plain inline script: runs while the HTML is parsed, before GTM (loaded after hydration) reads the consent. */}
          <script id="tl-consent-default" dangerouslySetInnerHTML={{ __html: consentDefaultScript() }} />
          <Script id="tl-gtm" strategy="afterInteractive">{gtmScript(gtmId)}</Script>
        </>
      )}
      {metaPixelId && <Script id="tl-meta-pixel" strategy="afterInteractive">{metaPixelScript(metaPixelId)}</Script>}
    </>
  );
}
