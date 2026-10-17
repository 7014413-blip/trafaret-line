// What the cabinet page says when a sign-in did not work (/kabinet?pomylka=…).

import type { AccountSignInError } from "../../types/account";
import type { Locale } from "../../types/customizer";
import { ACCOUNT } from "../i18n/dictionaries/account";
import { tr } from "../i18n/translate";

export function signInErrorText(value: string | undefined, locale: Locale = "uk"): string | null {
  const texts = tr(ACCOUNT, locale).signInErrors;
  return value && value in texts ? texts[value as AccountSignInError] : null;
}
