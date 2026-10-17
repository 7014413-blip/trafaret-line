// Analytics (plan step 9): tag ids, Consent Mode v2, GA4 items, Meta events, contact links,
// visit source (UTM, gclid) and the event sent to the dataLayer and the pixel.

import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsConfig } from "../../lib/analytics/analytics-config";
import { cartLineItem, itemsValue, listItems, variantItem } from "../../lib/analytics/analytics-item";
import { attributionFromUrl, cleanAttribution, nextAttribution } from "../../lib/analytics/attribution";
import { CONSENT_VERSION, consentModeState, readStoredConsent, storedConsent } from "../../lib/analytics/consent-mode";
import { linkEvent } from "../../lib/analytics/link-event";
import { metaEvent } from "../../lib/analytics/meta-event";
import { consentDefaultScript, gtmScript, metaPixelScript } from "../../lib/analytics/tag-scripts";
import { trackEvent } from "../../lib/analytics/track-event";
import { contentSecurityPolicy } from "../../lib/security/headers";

const NOW = new Date("2026-10-17T10:00:00.000Z");

describe("analyticsConfig", () => {
  it("takes well-formed ids and ignores typos", () => {
    expect(analyticsConfig(" gtm-ab12cd3 ", "1234567890123456")).toEqual({ gtmId: "GTM-AB12CD3", metaPixelId: "1234567890123456" });
    expect(analyticsConfig("UA-12345-1", "pixel")).toEqual({ gtmId: null, metaPixelId: null });
    expect(analyticsConfig(undefined, undefined)).toEqual({ gtmId: null, metaPixelId: null });
  });
});

describe("consent", () => {
  it("grants or denies all four Consent Mode v2 signals together", () => {
    expect(consentModeState("granted")).toEqual({ ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
  });

  it("asks again when the stored answer is broken or for an older banner", () => {
    expect(readStoredConsent(JSON.stringify(storedConsent("denied", NOW)))?.choice).toBe("denied");
    expect(readStoredConsent(JSON.stringify({ choice: "granted", version: CONSENT_VERSION - 1 }))).toBeNull();
    expect(readStoredConsent("{oops")).toBeNull();
    expect(readStoredConsent(null)).toBeNull();
  });

  it("starts Google with everything denied and the pixel revoked", () => {
    expect(consentDefaultScript()).toContain("analytics_storage:'denied'");
    expect(gtmScript("GTM-AB12CD3")).toContain("\"GTM-AB12CD3\"");
    const pixel = metaPixelScript("1234567890123456");
    expect(pixel).toContain("'revoke'");
    expect(pixel).toContain("fbq('init',\"1234567890123456\")");
  });
});

describe("GA4 items", () => {
  it("uses the variant id for catalogue lines and the kind for constructor lines", () => {
    expect(cartLineItem({ key: "cat|v1|{}", title: "Троянди", kind: "catalog", variantId: "v1", unitPrice: 171, quantity: 10 }, 0))
      .toEqual({ item_id: "v1", item_name: "Троянди", item_category: "catalog", price: 171, quantity: 10, index: 0 });
    expect(cartLineItem({ key: "sign|abc", title: "Вивіска", kind: "sign", unitPrice: 1600.004, quantity: 1 }, 2).item_id).toBe("sign:sign|abc");
    expect(cartLineItem({ key: "k", title: "Напис", unitPrice: 150, quantity: 1 }, 0).item_category).toBe("stencil");
  });

  it("names the variant of a product page by size and material", () => {
    const item = variantItem({ title: "Троянди" }, { id: "v1", sku: "TL-1", sizeLabel: "20 × 20 см", materialLabel: "PET 0,5 мм", price: 180 });
    expect(item).toMatchObject({ item_id: "TL-1", item_variant: "20 × 20 см, PET 0,5 мм", price: 180, quantity: 1 });
  });

  it("sums the value and keeps list positions", () => {
    expect(itemsValue([{ item_id: "a", item_name: "a", item_category: "c", price: 171, quantity: 10 }, { item_id: "b", item_name: "b", item_category: "c", price: 85, quantity: 1 }])).toBe(1795);
    const list = listItems([{ handle: "a", title: "A", minPrice: 120 }, { handle: "b", title: "B", minPrice: 90 }], "Торти", 1);
    expect(list).toEqual([{ item_id: "a", item_name: "A", item_category: "catalog", item_list_name: "Торти", price: 120, quantity: 1, index: 0 }]);
  });
});

describe("metaEvent", () => {
  it("maps purchase with the order, value and contents", () => {
    const event = metaEvent("purchase", { value: 1710, transaction_id: "1042", items: [{ item_id: "TL-1", item_name: "Т", item_category: "catalog", price: 171, quantity: 10 }] });
    expect(event).toEqual({
      name: "Purchase",
      params: { value: 1710, currency: "UAH", content_type: "product", content_ids: ["TL-1"], contents: [{ id: "TL-1", quantity: 10, item_price: 171 }], num_items: 10, order_id: "1042" },
    });
  });

  it("skips events Meta has no standard name for", () => {
    expect(metaEvent("view_item_list", {})).toBeNull();
    expect(metaEvent("phone_click", { link_type: "phone" })?.name).toBe("Contact");
  });
});

describe("linkEvent", () => {
  it("knows phone and messenger links", () => {
    expect(linkEvent("tel:+380662819720")).toEqual({ name: "phone_click", linkType: "phone" });
    expect(linkEvent("viber://chat?number=+380662819720")).toEqual({ name: "messenger_click", linkType: "viber" });
    expect(linkEvent("https://t.me/trafaretline")?.linkType).toBe("telegram");
    expect(linkEvent("https://wa.me/380662819720")?.linkType).toBe("whatsapp");
    expect(linkEvent("/catalog")).toBeNull();
  });
});

describe("attribution", () => {
  it("reads UTM tags and click ids of the landing page", () => {
    const found = attributionFromUrl(new URL("https://trafaret-line.com.ua/p/rose?utm_source=google&utm_medium=cpc&gclid=abc&x=1"), NOW);
    expect(found).toEqual({ utm_source: "google", utm_medium: "cpc", gclid: "abc", landing: "/p/rose", at: NOW.toISOString() });
    expect(attributionFromUrl(new URL("https://trafaret-line.com.ua/catalog"), NOW)).toBeNull();
  });

  it("lets a new source win and drops one older than 30 days", () => {
    const old = { utm_source: "facebook", at: "2026-10-01T00:00:00.000Z" };
    expect(nextAttribution(old, null, NOW)).toEqual(old);
    expect(nextAttribution(old, { utm_source: "google", at: NOW.toISOString() }, NOW)?.utm_source).toBe("google");
    expect(nextAttribution({ utm_source: "x", at: "2026-09-01T00:00:00.000Z" }, null, NOW)).toBeNull();
  });

  it("keeps only known keys as short plain strings", () => {
    const cleaned = cleanAttribution({ utm_source: "g\u0000oogle", gclid: "x".repeat(500), evil: "<script>", utm_medium: 5 });
    expect(cleaned).toEqual({ utm_source: "google", gclid: "x".repeat(200) });
    expect(cleanAttribution("text")).toEqual({});
  });
});

describe("trackEvent", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("clears the previous ecommerce object and sends the same event_id to the pixel", () => {
    const dataLayer: unknown[] = [];
    const fbq = vi.fn();
    vi.stubGlobal("window", { dataLayer, fbq });
    trackEvent("add_to_cart", { value: 180, items: [{ item_id: "TL-1", item_name: "Т", item_category: "catalog", price: 180, quantity: 1 }] });
    expect(dataLayer[0]).toEqual({ ecommerce: null });
    const event = dataLayer[1] as { event: string; event_id: string; ecommerce: { currency: string; value: number } };
    expect(event.event).toBe("add_to_cart");
    expect(event.ecommerce).toMatchObject({ currency: "UAH", value: 180 });
    expect(fbq).toHaveBeenCalledWith("track", "AddToCart", expect.objectContaining({ value: 180 }), { eventID: event.event_id });
  });

  it("does nothing without the tags", () => {
    vi.stubGlobal("window", {});
    expect(() => trackEvent("phone_click", { link_type: "phone" })).not.toThrow();
  });
});

describe("content security policy", () => {
  it("allows the Google and Meta tags", () => {
    const csp = contentSecurityPolicy("https://api.trafaret-line.com.ua", true);
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net");
    expect(csp).toContain("https://*.google-analytics.com");
  });
});
