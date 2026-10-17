// Russian version (plan step 12): the same shop under /ru/ with Russian texts from the
// catalogue, language links between the versions and hreflang for search engines.

import { expect, test } from "@playwright/test";
import { clearOrders, receivedOrders } from "./support/shop";
import { fillContactsAndDelivery } from "./support/checkout-form";

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

test("a Russian buyer orders in Russian, cash on delivery", async ({ page, request }) => {
  await clearOrders(request);
  await page.goto("/ru/p/trafaret-troiandy");
  await page.getByRole("radio", { name: /20 × 20 см/ }).click();
  await page.getByRole("radio", { name: "PET 0,5 мм" }).check();
  await page.getByRole("button", { name: "Купить" }).first().click();
  await page.getByRole("dialog", { name: "Корзина" }).getByRole("button", { name: /Оформить/ }).click();
  await expect(page).toHaveURL(/\/ru\/checkout$/);
  await expect(page.getByRole("heading", { level: 1, name: "Оформление заказа" })).toBeVisible();

  await page.getByRole("button", { name: /Подтвердить заказ/ }).click();
  await expect(page.getByText("Введите номер в формате +380 XX XXX XX XX")).toBeVisible();

  await fillContactsAndDelivery(page);
  await page.getByRole("radio", { name: "Наложенный платёж при получении" }).check();
  await page.getByRole("button", { name: /Подтвердить заказ · 180 ₴/ }).click();
  await expect(page.getByRole("heading", { name: /Спасибо! Заказ TL-1001/ })).toBeVisible();
  const [order] = await receivedOrders(request);
  expect(order.body.lines[0].title).toBe("Трафарет для торта «Розы», 20 × 20 см, PET 0,5 мм");
});

test("card payment opens WayForPay in Russian and returns to the Russian thank-you page", async ({ page, request }) => {
  await clearOrders(request);
  let posted = "";
  await page.route("https://secure.wayforpay.com/pay", (route) => {
    posted = route.request().postData() ?? "";
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><title>WayForPay</title><h1>WayForPay</h1>" });
  });
  await page.goto("/ru/p/trafaret-troiandy");
  await page.getByRole("button", { name: "Купить" }).first().click();
  await page.goto("/ru/checkout");
  await fillContactsAndDelivery(page);
  await page.getByRole("button", { name: /Подтвердить заказ/ }).click();
  await expect(page.getByRole("heading", { name: "WayForPay" })).toBeVisible();
  expect(new URLSearchParams(posted).get("language")).toBe("RU");

  const back = await request.post("/pay-return?order=TL-1001&lang=ru", { form: { transactionStatus: "Approved" }, maxRedirects: 0 });
  expect(back.status()).toBe(303);
  expect(back.headers().location).toMatch(/\/ru\/thank-you\?order=TL-1001&pay=Approved$/);
  await page.goto(back.headers().location);
  await expect(page.getByText("Оплата получена.")).toBeVisible();
});
