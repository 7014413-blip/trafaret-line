// Inline scripts of the tags. The consent default runs before Google Tag Manager loads: every
// Consent Mode signal starts "denied" and turns "granted" right away for a buyer who accepted
// earlier (localStorage "tl-consent" of the current banner version). The Meta pixel starts with
// consent revoked the same way. Ids are checked by analyticsConfig before they get here.

import { CONSENT_STORAGE_KEY } from "./consent-storage-key";
import { CONSENT_VERSION } from "./consent-mode";

/** JavaScript that is true when the stored answer is «Прийняти» for the current banner. */
function grantedExpression(): string {
  return `(function(){try{var c=JSON.parse(localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)})||"null");return !!c&&c.choice==="granted"&&c.version===${CONSENT_VERSION};}catch(e){return false;}})()`;
}

export function consentDefaultScript(): string {
  return [
    "window.dataLayer=window.dataLayer||[];",
    "window.gtag=function(){window.dataLayer.push(arguments);};",
    "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});",
    `if(${grantedExpression()}){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});}`,
  ].join("");
}

export function gtmScript(gtmId: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`;
}

export function metaPixelScript(pixelId: string): string {
  return [
    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
    `fbq('consent',${grantedExpression()}?'grant':'revoke');`,
    `fbq('init',${JSON.stringify(pixelId)});`,
    "fbq('track','PageView');",
  ].join("");
}
