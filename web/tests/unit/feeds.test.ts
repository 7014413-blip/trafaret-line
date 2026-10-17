// Product feed for Google Merchant Center and Meta, the shop markup and the ?variant= link.

import { describe, expect, it } from "vitest";
import type { CatalogCategory, CatalogProduct, CatalogVariant } from "../../types/catalog";
import { htmlToText } from "../../lib/feeds/html-to-text";
import { merchantItems } from "../../lib/feeds/merchant-items";
import { merchantFeedXml } from "../../lib/feeds/merchant-xml";
import { variantFromSearch } from "../../lib/catalog/variant-from-search";
import { organizationJsonLd, websiteJsonLd } from "../../lib/seo/organization-json-ld";
import { schemaAvailability } from "../../lib/seo/schema-availability";

const BASE = "https://trafaret-line.com.ua";

function variant(id: string, sku: string | null, size: string, material: string, price: number): CatalogVariant {
  return { id, sku, title: `${size} · ${material}`, sizeLabel: size, materialLabel: material, sizeCode: null, materialCode: null, sheetMm: null, price };
}

function category(handle: string, name: string, parentHandle: string | null): CatalogCategory {
  return { id: `pcat_${handle}`, handle, name, path: `/${handle}/`, parentHandle, rank: 0, image: null, seo: { title: name, description: name }, intro: "", bodyHtml: "", faq: [], children: [] };
}

const CATEGORIES = [category("food", "Торти і кава", null), category("food-tort", "Торти", "food")];

function product(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "prod_1", handle: "trafaret-troiandy", title: "Трафарет «Троянди»", subtitle: "",
    images: [{ url: `${BASE}/a.jpg`, alt: "", kind: "main" }, { url: `${BASE}/b.jpg`, alt: "", kind: "gallery" }],
    minPrice: 120, sizeCount: 2, hit: false, isNew: false, kind: "ready", categoryHandles: ["food-tort"], materialLabels: ["PET 0,5 мм"],
    descriptionHtml: "<p>Візерунок &laquo;троянди&raquo;<br>для крему</p><ul><li>PET</li></ul>",
    features: [], faq: [], seo: { title: "Троянди", description: "Опис для пошуку" }, sizes: [], materials: [],
    variants: [variant("variant_20", "TR-20", "20 × 20 см", "PET 0,5 мм", 120), variant("variant_30", null, "30 × 30 см", "PET 0,5 мм", 200)],
    blocks: [], relatedHandles: [], fields: [], availability: "in_stock", hole: null, monogram: null, constructorPath: null,
    ...overrides,
  };
}

describe("htmlToText", () => {
  it("drops tags, decodes entities and keeps words apart", () => {
    expect(htmlToText("<p>Візерунок &laquo;троянди&raquo;<br>для крему</p><ul><li>PET</li></ul>")).toBe("Візерунок «троянди» для крему PET");
  });
});

describe("merchantItems", () => {
  it("makes one item per variant with its price, link and the catalogue path", () => {
    const items = merchantItems(product(), CATEGORIES, BASE);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: "TR-20", groupId: "trafaret-troiandy", title: "Трафарет «Троянди», 20 × 20 см, PET 0,5 мм",
      link: `${BASE}/p/trafaret-troiandy?variant=variant_20`, imageLink: `${BASE}/a.jpg`, additionalImageLinks: [`${BASE}/b.jpg`],
      availability: "in_stock", price: 120, size: "20 × 20 см", material: "PET 0,5 мм",
      productType: "Торти і кава > Торти", customLabel0: "Торти і кава", description: "Візерунок «троянди» для крему PET",
    });
    expect(items[1].id).toBe("variant_30");
  });

  it("sells «під замовлення» as in stock and marks «немає» out of stock", () => {
    expect(merchantItems(product({ availability: "on_order" }), CATEGORIES, BASE)[0].availability).toBe("in_stock");
    expect(merchantItems(product({ availability: "out_of_stock" }), CATEGORIES, BASE)[0].availability).toBe("out_of_stock");
  });

  it("skips products without a photo and variants without a price", () => {
    expect(merchantItems(product({ images: [] }), CATEGORIES, BASE)).toEqual([]);
    const free = product({ variants: [variant("v0", null, "20 × 20 см", "PET", 0)] });
    expect(merchantItems(free, CATEGORIES, BASE)).toEqual([]);
  });

  it("keeps the title within 150 characters", () => {
    const long = merchantItems(product({ title: "Т".repeat(200) }), CATEGORIES, BASE)[0];
    expect(long.title.length).toBe(150);
    expect(long.title.endsWith("…")).toBe(true);
  });
});

describe("merchantFeedXml", () => {
  it("writes the Google namespace, the price in UAH and escapes every value", () => {
    const [item] = merchantItems(product({ title: "A & B <script>" }), CATEGORIES, BASE);
    const text = merchantFeedXml({ title: "Trafaret Line", link: `${BASE}/`, description: "Каталог", items: [item] });
    expect(text).toContain("xmlns:g=\"http://base.google.com/ns/1.0\"");
    expect(text).toContain("<g:price>120.00 UAH</g:price>");
    expect(text).toContain("<g:identifier_exists>no</g:identifier_exists>");
    expect(text).toContain("A &amp; B &lt;script&gt;");
    expect(text).not.toContain("<script>");
  });

  it("removes control characters that XML does not allow", () => {
    const [item] = merchantItems(product({ descriptionHtml: "a\u0001b\tc" }), CATEGORIES, BASE);
    const text = merchantFeedXml({ title: "T", link: BASE, description: "D", items: [item] });
    expect(text).toContain("<g:description>ab c</g:description>");
  });
});

describe("variantFromSearch", () => {
  const variants = product().variants;
  it("finds the variant of the link and ignores unknown ids", () => {
    expect(variantFromSearch("?variant=variant_30", variants)?.sizeLabel).toBe("30 × 30 см");
    expect(variantFromSearch("?variant=other", variants)).toBeNull();
    expect(variantFromSearch("", variants)).toBeNull();
  });
});

describe("shop markup", () => {
  it("lists both branches, Запоріжжя by its city until the street is known", () => {
    const ld = organizationJsonLd(BASE) as { location: { address: Record<string, string> }[]; logo: string };
    expect(ld.logo).toBe(`${BASE}/logo.png`);
    expect(ld.location.map((l) => l.address.addressLocality)).toEqual(["Бориспіль", "Запоріжжя"]);
    expect(ld.location[0].address.streetAddress).toBe("вул. Гостинна, 46");
    expect(ld.location[1].address.streetAddress).toBeUndefined();
  });

  it("points the site search box at /poshuk", () => {
    const ld = websiteJsonLd(BASE) as { potentialAction: { target: { urlTemplate: string } } };
    expect(ld.potentialAction.target.urlTemplate).toBe(`${BASE}/poshuk?q={search_term_string}`);
  });

  it("maps the admin availability to schema.org", () => {
    expect(schemaAvailability("on_order")).toBe("https://schema.org/MadeToOrder");
    expect(schemaAvailability("out_of_stock")).toBe("https://schema.org/OutOfStock");
  });
});
