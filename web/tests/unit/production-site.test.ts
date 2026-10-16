// robots.txt opens the site to search engines only on the real domain (lib/seo/production-site.ts).

import { describe, expect, it } from "vitest";
import { isProductionSite } from "@/lib/seo/production-site";

describe("real shop address", () => {
  it("accepts only the shop's own domain", () => {
    expect(isProductionSite("https://trafaret-line.com.ua")).toBe(true);
    expect(isProductionSite("https://www.trafaret-line.com.ua")).toBe(true);
    expect(isProductionSite("https://TRAFARET-LINE.com.ua/")).toBe(true);
  });

  it("treats staging subdomains, other domains and broken values as closed", () => {
    expect(isProductionSite("https://test.trafaret-line.com.ua")).toBe(false);
    expect(isProductionSite("https://api-test.trafaret-line.com.ua")).toBe(false);
    expect(isProductionSite("https://nottrafaret-line.com.ua")).toBe(false);
    expect(isProductionSite("http://localhost:3100")).toBe(false);
    expect(isProductionSite("not a url")).toBe(false);
  });
});
