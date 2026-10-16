// Whether an address is the real shop. Only trafaret-line.com.ua itself (or www.) counts:
// a staging copy on a subdomain such as test.trafaret-line.com.ua ends with the same text,
// but must stay closed to search engines.

import { SITE } from "../../data/site";

export function isProductionSite(base: string): boolean {
  let host: string;
  try {
    host = new URL(base).hostname.toLowerCase();
  } catch {
    return false;
  }
  return host === SITE.domain || host === `www.${SITE.domain}`;
}
