// Product feed for Google Merchant Center and Meta, the link of a feed item, and the shop
// markup on the home page (plan step 9).

import { expect, test } from "@playwright/test";

test("the feed lists every variant with its price and a link that opens it", async ({ page, request }) => {
  const response = await request.get("/feeds/google-merchant.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/xml");
  const xml = await response.text();
  expect(xml.match(/<item>/g)).toHaveLength(4);
  expect(xml).toContain("<g:id>TL-ROSE-01</g:id>");
  expect(xml).toContain("<g:title>Трафарет для торта «Троянди», 15 × 15 см, Полістирол 1 мм</g:title>");
  expect(xml).toContain("<g:price>160.00 UAH</g:price>");
  expect(xml).toContain("<g:product_type>Торти і кава &gt; Торти</g:product_type>");
  expect(xml).not.toContain("м²");

  const link = xml.match(/<g:link>([^<]*variant_0_1)<\/g:link>/)?.[1];
  expect(link).toBeTruthy();
  await page.goto(new URL(link as string).pathname + new URL(link as string).search);
  await expect(page.getByText("15 × 15 см · Полістирол 1 мм")).toBeVisible();
  await expect(page.getByText("160 ₴").first()).toBeVisible();
});

test("the home page carries the shop and its search box in schema.org markup", async ({ page, request }) => {
  await page.goto("/");
  const blocks = await page.locator("script[type='application/ld+json']").allTextContents();
  const types = blocks.flatMap((text) => [JSON.parse(text)].flat().map((ld: { "@type": string }) => ld["@type"]));
  expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite"]));
  const logo = await request.get("/logo.png");
  expect(logo.status()).toBe(200);
  expect(logo.headers()["content-type"]).toBe("image/png");
});
