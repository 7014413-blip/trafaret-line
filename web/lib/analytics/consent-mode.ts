// Google Consent Mode v2: until the buyer answers the banner every signal is "denied", so
// GA4 only gets cookieless pings (modelled conversions); «Прийняти» grants all four.

import type { ConsentChoice, ConsentModeState, StoredConsent } from "../../types/analytics";

/** Raise when the banner text changes: everyone is asked again. */
export const CONSENT_VERSION = 1;

export function consentModeState(choice: ConsentChoice): ConsentModeState {
  return { ad_storage: choice, ad_user_data: choice, ad_personalization: choice, analytics_storage: choice };
}

/** The stored answer if it is valid and given to the current banner text, else null (ask again). */
export function readStoredConsent(raw: string | null): StoredConsent | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredConsent>;
    if ((value.choice !== "granted" && value.choice !== "denied") || value.version !== CONSENT_VERSION) return null;
    return { choice: value.choice, version: value.version, at: typeof value.at === "string" ? value.at : "" };
  } catch {
    return null;
  }
}

export function storedConsent(choice: ConsentChoice, now: Date): StoredConsent {
  return { choice, version: CONSENT_VERSION, at: now.toISOString() };
}
