// Product choice: the customer finds a stencil in its section, picks size and material, sees
// the price for the quantity (never m²) and puts it into the cart.

import { expect, test } from "@playwright/test";
import { addRoseStencil } from "./support/shop";

test("finds a stencil in its section and opens it", async ({ page }) => {
  await page.goto("/food/tort");
  await expect(page.getByRole("heading", { level: 1, name: "Торти" })).toBeVisible();
  await expect(page.getByText("1 товар")).toBeVisible();
  const card = page.getByRole("link", { name: /Трафарет для торта «Троянди»/ });
  // Both badges the manager set in «Простий кабінет».
  await expect(card.getByText("Новинка", { exact: true })).toBeVisible();
  await expect(card.getByText("Хіт", { exact: true })).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/p\/trafaret-troiandy$/);
  await expect(page.getByRole("heading", { level: 1, name: "Трафарет для торта «Троянди»" })).toBeVisible();
});

test("price follows size, material and quantity, without m²", async ({ page }) => {
  await page.goto("/p/trafaret-troiandy");
  const sizes = page.getByRole("radiogroup", { name: "Розмір" });
  await sizes.getByRole("radio", { name: /15 × 15 см/ }).click();
  await page.getByRole("radio", { name: "Полістирол 1 мм" }).check();
  await expect(page.getByText("15 × 15 см · Полістирол 1 мм")).toBeVisible();
  await expect(page.getByText("160 ₴").first()).toBeVisible();

  await sizes.getByRole("radio", { name: /20 × 20 см/ }).click();
  await page.getByRole("radio", { name: "PET 0,5 мм" }).check();
  await page.getByRole("spinbutton", { name: "Кількість" }).fill("10");
  // 180 ₴ − 5 % from 10 pieces = 171 ₴ each.
  await expect(page.getByText("171 ₴ × 10")).toBeVisible();
  await expect(page.getByText("1 710 ₴").first()).toBeVisible();

  await expect(page.locator("body")).not.toContainText("м²");
});

test("adds the chosen stencil to the cart", async ({ page }) => {
  await addRoseStencil(page, 2);
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toContainText("Трафарет для торта «Троянди», 20 × 20 см, PET 0,5 мм");
  await expect(cart.locator("output")).toHaveText("2");
  await expect(cart).not.toContainText("м²");
});
