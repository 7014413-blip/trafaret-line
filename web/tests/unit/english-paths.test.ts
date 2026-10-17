// English addresses (plan step 12): English has its own slugs, and only pages listed in
// data/knowledge_base/paths_en.json exist under /en/.

import { describe, expect, it } from "vitest";
import { englishPath, ukrainianPath } from "../../lib/i18n/english-paths";
import { hasLocaleVersion, localePath, splitLocalePath } from "../../lib/i18n/locale-path";
import { localeRoute } from "../../lib/i18n/locale-route";
import { languageAlternates } from "../../lib/seo/page-meta";

describe("English addresses", () => {
  it("translates listed pages both ways and knows nothing else", () => {
    expect(englishPath("/vyvisky/vkazivnyky")).toBe("/signs/arrow-signs");
    expect(ukrainianPath("/signs/arrow-signs")).toBe("/vyvisky/vkazivnyky");
    expect(englishPath("/vidguk/order_01J8")).toBe("/review/order_01J8");
    expect(ukrainianPath("/review/order_01J8")).toBe("/vidguk/order_01J8");
    expect(englishPath("/vidguk/order_01J8/more")).toBeNull();
    expect(englishPath("/oferta")).toBeNull();
    expect(ukrainianPath("/vyvisky")).toBeNull();
  });

  it("gives English links their own address and keeps Ukrainian for untranslated pages", () => {
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("en", "/zahotovky?shape=heart#top")).toBe("/en/blanks?shape=heart#top");
    expect(localePath("en", "/oferta")).toBe("/oferta");
    expect(localePath("en", "/en/blanks")).toBe("/en/blanks");
    expect(hasLocaleVersion("en", "/oferta")).toBe(false);
    expect(hasLocaleVersion("ru", "/oferta")).toBe(true);
  });

  it("reads the Ukrainian page back from an English address", () => {
    expect(splitLocalePath("/en/signs/arrow-signs")).toEqual({ locale: "en", path: "/vyvisky/vkazivnyky" });
    expect(splitLocalePath("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocalePath("/english-stencils")).toEqual({ locale: "uk", path: "/english-stencils" });
  });

  it("serves an English address from the Ukrainian route and sends unknown ones to 404", () => {
    expect(localeRoute("/en")).toEqual({ action: "rewrite", path: "/en" });
    expect(localeRoute("/en/signs")).toEqual({ action: "rewrite", path: "/en/vyvisky" });
    expect(localeRoute("/en/signs/")).toEqual({ action: "rewrite", path: "/en/vyvisky" });
    expect(localeRoute("/en/vyvisky")).toEqual({ action: "rewrite", path: "/en/__no-english-version" });
    expect(localeRoute("/en/p/trafaret-troiandy")).toEqual({ action: "rewrite", path: "/en/__no-english-version" });
  });

  it("lists English in hreflang only where the page has an English version", () => {
    expect(languageAlternates("/vyvisky")).toEqual({ "uk-UA": "/vyvisky", "ru-UA": "/ru/vyvisky", "en-UA": "/en/signs", "x-default": "/vyvisky" });
    expect(languageAlternates("/oferta")).toEqual({ "uk-UA": "/oferta", "ru-UA": "/ru/oferta", "x-default": "/oferta" });
  });
});
