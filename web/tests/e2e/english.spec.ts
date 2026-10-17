// English version under /en/ (plan step 12): English addresses, English texts, and no page
// without an English version.

import { expect, test } from "@playwright/test";

test("the English home page links English addresses and switches languages", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="alternate"][hreflang="en-UA"]')).toHaveAttribute("href", /\/en$/);
  await expect(page.locator('a[href="/en/signs"]').first()).toBeAttached();
  await expect(page.locator('a[href="/vyvisky"]')).toHaveCount(0);
  await page.getByRole("link", { name: "УКР" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the arrow sign constructor speaks English at its English address", async ({ page }) => {
  await page.goto("/en/signs/arrow-signs");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("arrow sign");
  const size = page.getByRole("button", { name: /30×12 cm/ });
  await size.click();
  await expect(size).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("dialog")).toContainText("Pointer sign “COFFEE SHOP");
  await expect(page.locator("body")).not.toContainText("м²");
  await expect(page.locator("body")).not.toContainText(" см");
});

test("pages without an English version answer 404 under /en/", async ({ page }) => {
  const ukrainianSlug = await page.goto("/en/vyvisky");
  expect(ukrainianSlug?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page does not exist" })).toBeVisible();
  const untranslated = await page.goto("/en/p/trafaret-troiandy");
  expect(untranslated?.status()).toBe(404);
});

test("the custom-size blanks page and the delivery page speak English", async ({ page }) => {
  await page.goto("/en/custom-blanks");
  await expect(page.getByRole("button", { name: "Add to cart" }).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(" мм");
  await page.goto("/en/delivery-and-payment");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("main")).toContainText("Nova Poshta");
});
