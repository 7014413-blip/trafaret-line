// Languages in addresses (plan step 12): Ukrainian at the root, Russian under /ru/, English
// under /en/ (its own slugs: tests/unit/english-paths.test.ts).

import { describe, expect, it } from "vitest";
import { localePath, splitLocalePath } from "../../lib/i18n/locale-path";
import { localeRoute } from "../../lib/i18n/locale-route";
import { localeOf } from "../../lib/i18n/locales";
import { tr } from "../../lib/i18n/translate";
import { pageMeta } from "../../lib/seo/page-meta";
import { mapProduct } from "../../lib/catalog/map-catalog";
import type { RawProduct } from "../../types/catalog";

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

describe("tr", () => {
  it("picks the page language", () => {
    const dictionary = { uk: "Каталог трафаретів", ru: "Каталог трафаретов", en: "Stencil catalog" };
    expect(tr(dictionary, "ru")).toBe("Каталог трафаретов");
    expect(tr(dictionary, "en")).toBe("Stencil catalog");
  });
});

describe("pageMeta", () => {
  it("gives a translated page its own canonical and every language version", () => {
    const meta = pageMeta({ title: "Каталог", description: "Усі розділи", path: "/catalog", locale: "ru" });
    expect(meta.alternates?.canonical).toBe("/ru/catalog");
    expect(meta.alternates?.languages).toEqual({ "uk-UA": "/catalog", "ru-UA": "/ru/catalog", "en-UA": "/en/catalog", "x-default": "/catalog" });
    expect(meta.openGraph).toMatchObject({ locale: "ru_UA", url: "/ru/catalog" });
  });

  it("keeps the Ukrainian canonical for a page that is not translated yet", () => {
    const meta = pageMeta({ title: "Оферта", description: "Умови", path: "/oferta" });
    expect(meta.alternates).toEqual({ canonical: "/oferta" });
    expect(meta.openGraph).toMatchObject({ locale: "uk_UA" });
  });
});

describe("catalogue in Russian", () => {
  const raw: RawProduct = {
    id: "prod_rose",
    title: "Трафарет для торта «Троянди»",
    subtitle: "Візерунок з троянд",
    handle: "trafaret-troiandy",
    description: "<p>Гнучкий трафарет.</p>",
    options: [
      { id: "opt_size", title: "Розмір", values: [{ value: "15 × 15 см" }] },
      { id: "opt_material", title: "Матеріал", values: [{ value: "Полістирол 1 мм" }] },
    ],
    variants: [{
      id: "variant_0",
      title: "15 × 15 см · Полістирол 1 мм",
      calculated_price: { calculated_amount: 160 },
      options: [{ value: "15 × 15 см", option: { title: "Розмір" } }, { value: "Полістирол 1 мм", option: { title: "Матеріал" } }],
      metadata: { title_ru: "15 × 15 см · Полистирол 1 мм" },
    }],
    metadata: {
      seo: { uk: { title: "Троянди | Trafaret Line", description: "Укр" }, ru: { title: "Розы | Trafaret Line", description: "Рус" } },
      features: { uk: ["Гнучкий"], ru: ["Гибкий"] },
      size_details: { "15 × 15 см": { uk: "Малюнок 13 см", ru: "Рисунок 13 см" } },
      i18n: { ru: { title: "Трафарет для торта «Розы»", subtitle: "Узор из роз", description: "<p>Гибкий трафарет.</p>", options: { "Матеріал": { "Полістирол 1 мм": "Полистирол 1 мм" } } } },
    },
  };

  it("reads the Russian texts and labels, Ukrainian stays as it was", () => {
    const ru = mapProduct(raw, "ru");
    expect(ru.title).toBe("Трафарет для торта «Розы»");
    expect(ru.subtitle).toBe("Узор из роз");
    expect(ru.descriptionHtml).toBe("<p>Гибкий трафарет.</p>");
    expect(ru.seo.title).toBe("Розы | Trafaret Line");
    expect(ru.features).toEqual(["Гибкий"]);
    expect(ru.sizes).toEqual([{ label: "15 × 15 см", detail: "Рисунок 13 см" }]);
    expect(ru.materials).toEqual(["Полистирол 1 мм"]);
    expect(ru.variants[0]).toMatchObject({ title: "15 × 15 см · Полистирол 1 мм", materialLabel: "Полистирол 1 мм", price: 160 });

    const uk = mapProduct(raw);
    expect(uk.title).toBe("Трафарет для торта «Троянди»");
    expect(uk.materials).toEqual(["Полістирол 1 мм"]);
    expect(uk.variants[0].materialLabel).toBe("Полістирол 1 мм");
  });

  it("falls back to Ukrainian where a translation is missing", () => {
    const bare = mapProduct({ ...raw, metadata: {} }, "ru");
    expect(bare.title).toBe("Трафарет для торта «Троянди»");
    expect(bare.materials).toEqual(["Полістирол 1 мм"]);
  });
});
