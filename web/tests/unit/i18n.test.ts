// Languages in addresses (plan step 12): Ukrainian at the root, Russian under /ru/.

import { describe, expect, it } from "vitest";
import { localePath, splitLocalePath } from "../../lib/i18n/locale-path";
import { localeRoute } from "../../lib/i18n/locale-route";
import { localeOf } from "../../lib/i18n/locales";

describe("localePath", () => {
  it("prefixes pages for Russian and leaves Ukrainian as it is", () => {
    expect(localePath("uk", "/catalog")).toBe("/catalog");
    expect(localePath("ru", "/catalog")).toBe("/ru/catalog");
    expect(localePath("ru", "/")).toBe("/ru");
    expect(localePath("ru", "/p/rose?variant=v1")).toBe("/ru/p/rose?variant=v1");
  });

  it("never prefixes twice, files, API routes, anchors or other sites", () => {
    expect(localePath("ru", "/ru/catalog")).toBe("/ru/catalog");
    expect(localePath("ru", "/api/kabinet/logout")).toBe("/api/kabinet/logout");
    expect(localePath("ru", "/demo/rose.jpg")).toBe("/demo/rose.jpg");
    expect(localePath("ru", "#reviews")).toBe("#reviews");
    expect(localePath("ru", "https://t.me/x")).toBe("https://t.me/x");
    expect(localePath("ru", "//cdn.example.com/a")).toBe("//cdn.example.com/a");
  });

  it("splits the language off a path", () => {
    expect(splitLocalePath("/ru/konstruktor")).toEqual({ locale: "ru", path: "/konstruktor" });
    expect(splitLocalePath("/ru")).toEqual({ locale: "ru", path: "/" });
    expect(splitLocalePath("/rukavychky")).toEqual({ locale: "uk", path: "/rukavychky" });
  });
});

describe("localeRoute", () => {
  it("serves Ukrainian pages from the uk segment and redirects the /uk prefix away", () => {
    expect(localeRoute("/")).toEqual({ action: "rewrite", path: "/uk" });
    expect(localeRoute("/food/tort")).toEqual({ action: "rewrite", path: "/uk/food/tort" });
    expect(localeRoute("/uk/food")).toEqual({ action: "redirect", path: "/food" });
    expect(localeRoute("/uk")).toEqual({ action: "redirect", path: "/" });
  });

  it("passes other languages, files and API routes", () => {
    expect(localeRoute("/ru/food")).toEqual({ action: "pass" });
    expect(localeRoute("/api/novaposhta")).toEqual({ action: "pass" });
    expect(localeRoute("/feeds/google-merchant.xml")).toEqual({ action: "pass" });
    expect(localeRoute("/sitemap.xml")).toEqual({ action: "pass" });
    expect(localeRoute("/demo/hero.jpg")).toEqual({ action: "pass" });
    expect(localeRoute("/pay-return")).toEqual({ action: "pass" });
  });

  it("treats an unknown language as Ukrainian", () => {
    expect(localeOf("ru")).toBe("ru");
    expect(localeOf("de")).toBe("uk");
    expect(localeOf(undefined)).toBe("uk");
  });
});
