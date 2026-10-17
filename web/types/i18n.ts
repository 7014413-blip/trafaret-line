// Languages of the site (plan step 12): Ukrainian is the main one and lives at the root
// ("/catalog"), Russian under "/ru/", English under "/en/" once it is translated.
// The Locale type itself is in types/customizer.ts (shared with the constructor texts).

import type { Locale } from "./customizer";

/** Language of a page as App Router passes it: the [lang] segment. */
export interface LangParams {
  lang: string;
}

/** Texts of one part of the site in every language; English falls back to Ukrainian until translated. */
export type Dictionary<T> = { uk: T; ru: T } & Partial<Record<Exclude<Locale, "uk" | "ru">, T>>;
