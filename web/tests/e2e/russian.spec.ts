// Russian version (plan step 12): the same shop under /ru/ with Russian texts from the
// catalogue, language links between the versions and hreflang for search engines.

import { expect, test } from "@playwright/test";

test("home page in Russian links its Ukrainian version", async ({ page }) => {
  await page.goto("/ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1, name: /Узор на стене/ })).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang="uk-UA"]')).toHaveAttribute("href", /^https?:\/\/[^/]+\/?$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ru$/);
  await page.getByRole("navigation", { name: "Язык сайта" }).getByRole("link", { name: "УКР" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Візерунок на стіні/ })).toBeVisible();
});

test("section and product pages read the Russian catalogue texts", async ({ page }) => {
  await page.goto("/ru/food/tort");
  await expect(page.getByRole("heading", { level: 1, name: "Торты" })).toBeVisible();
  await expect(page.getByText("1 товар")).toBeVisible();
  await page.getByRole("link", { name: /Трафарет для торта «Розы»/ }).click();
  await expect(page).toHaveURL(/\/ru\/p\/trafaret-troiandy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Трафарет для торта «Розы»" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Полистирол 1 мм" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Купить" })).toBeVisible();
  await expect(page.locator('link[rel="alternate"][hreflang="ru-UA"]')).toHaveAttribute("href", /\/ru\/p\/trafaret-troiandy$/);
  await expect(page.locator("body")).not.toContainText("м²");
});

test("the Ukrainian address /uk/… leads to the address without a prefix", async ({ page }) => {
  await page.goto("/uk/catalog");
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
});
