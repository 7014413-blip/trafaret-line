// The buyer's cookie choice: kept in localStorage and passed to Google (Consent Mode v2) and
// the Meta pixel at once. «tl-consent-open» reopens the banner (footer «Налаштування cookies»).

import type { AnalyticsWindow, ConsentChoice, StoredConsent } from "../../types/analytics";
import { consentModeState, readStoredConsent, storedConsent } from "../analytics/consent-mode";
import { CONSENT_STORAGE_KEY } from "../analytics/consent-storage-key";
import { readStored, writeStored } from "./browser-storage";

export const CONSENT_OPEN_EVENT = "tl-consent-open";

export function currentConsent(): StoredConsent | null {
  return readStoredConsent(readStored("local", CONSENT_STORAGE_KEY));
}

export function applyConsent(choice: ConsentChoice): void {
  writeStored("local", CONSENT_STORAGE_KEY, JSON.stringify(storedConsent(choice, new Date())));
  const target = window as unknown as AnalyticsWindow;
  target.gtag?.("consent", "update", consentModeState(choice));
  target.fbq?.("consent", choice === "granted" ? "grant" : "revoke");
}
