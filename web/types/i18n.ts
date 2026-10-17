// Languages of the site (plan step 12): Ukrainian is the main one and lives at the root
// ("/catalog"), Russian under "/ru/", English under "/en/" once it is translated.
// The Locale type itself is in types/customizer.ts (shared with the constructor texts).

import type { Locale } from "./customizer";

/** Language of a page as App Router passes it: the [lang] segment. */
export interface LangParams {
  lang: string;
}

/** Texts of one part of the site in every language. */
export type Dictionary<T> = Record<Locale, T>;

/**
 * English addresses (data/knowledge_base/paths_en.json): English has its own slugs, and a page
 * has an English version only when it is listed here. Keys are Ukrainian site paths.
 */
export interface EnglishPaths {
  /** Site pages: Ukrainian path → English path. */
  pages: Record<string, string>;
  /** Pages with an id after the prefix ("/vidguk/<order>"): Ukrainian prefix → English prefix. */
  prefixes: Record<string, string>;
  /** Translated categories and products ("/p/<handle>"), written by the catalogue. */
  catalog: Record<string, string>;
}
