// English addresses of the site. Ukrainian and Russian share one path; English has its own
// slugs ("/vyvisky" → "/signs", "/p/trafaret-mandala" → "/p/mandala-stencil"), kept in
// data/knowledge_base/paths_en.json. A page without an entry has no English version: links
// to it from English pages lead to the Ukrainian page, and it is left out of hreflang and
// the sitemap. A broken file stops the build with the entry it trips on.

import raw from "../../data/knowledge_base/paths_en.json";
import type { EnglishPaths } from "../../types/i18n";

const FILE = "data/knowledge_base/paths_en.json";
const PATH = /^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/;
const PREFIX = /^\/[a-z0-9]+(-[a-z0-9]+)*\/$/;

const paths = raw as EnglishPaths;

function fail(message: string): never {
  throw new Error(`${FILE}: ${message}`);
}

/** Ukrainian → English and back for pages and catalogue entries; one English path per page. */
function buildMaps(): { toEnglish: Map<string, string>; toUkrainian: Map<string, string> } {
  const toEnglish = new Map<string, string>();
  const toUkrainian = new Map<string, string>();
  for (const [group, entries] of [["pages", paths.pages], ["catalog", paths.catalog]] as const) {
    if (!entries || typeof entries !== "object") fail(`"${group}" must be an object`);
    for (const [uk, en] of Object.entries(entries)) {
      if (!PATH.test(uk)) fail(`${group}: "${uk}" is not a site path`);
      if (typeof en !== "string" || !PATH.test(en)) fail(`${group}: English path of "${uk}" must be lowercase Latin words with hyphens`);
      if (toUkrainian.has(en)) fail(`${group}: "${en}" is used twice`);
      toEnglish.set(uk, en);
      toUkrainian.set(en, uk);
    }
  }
  return { toEnglish, toUkrainian };
}

function checkedPrefixes(): [string, string][] {
  if (!paths.prefixes || typeof paths.prefixes !== "object") fail(`"prefixes" must be an object`);
  return Object.entries(paths.prefixes).map(([uk, en]) => {
    if (!PREFIX.test(uk) || typeof en !== "string" || !PREFIX.test(en)) fail(`prefixes: "${uk}" → "${en}" must both look like "/word/"`);
    return [uk, en];
  });
}

const { toEnglish, toUkrainian } = buildMaps();
const PREFIXES = checkedPrefixes();

/** English path of a Ukrainian site path, or null when the page has no English version. */
export function englishPath(ukPath: string): string | null {
  const exact = toEnglish.get(ukPath);
  if (exact) return exact;
  for (const [uk, en] of PREFIXES) {
    if (ukPath.startsWith(uk) && ukPath.length > uk.length && !ukPath.slice(uk.length).includes("/")) return en + ukPath.slice(uk.length);
  }
  return null;
}

/** Ukrainian path of an English site path, or null when no page has that English address. */
export function ukrainianPath(enPath: string): string | null {
  const exact = toUkrainian.get(enPath);
  if (exact) return exact;
  for (const [uk, en] of PREFIXES) {
    if (enPath.startsWith(en) && enPath.length > en.length && !enPath.slice(en.length).includes("/")) return uk + enPath.slice(en.length);
  }
  return null;
}
