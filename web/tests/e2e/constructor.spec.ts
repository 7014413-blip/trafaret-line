// Constructors: the customer types their own text, the price appears at once, and the design
// goes into the cart with its size.

import { expect, test } from "@playwright/test";

test("pointer sign: fixed size price and add to cart", async ({ page }) => {
  await page.goto("/vyvisky/vkazivnyky");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Табличка-стрілка");
  const buy = page.getByRole("button", { name: "В кошик" });
  await expect(buy).toBeEnabled();
  await expect(page.getByText("450 ₴").first()).toBeVisible();

  const size = page.getByRole("button", { name: /30×12 см/ });
  await size.click();
  await expect(size).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Розмір 30 × 12 см")).toBeVisible();
  await buy.click();

  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  await expect(cart).toContainText("600 ₴");
  await expect(page.locator("body")).not.toContainText("м²");
});

test("own text stencil: preview, price and add to cart", async ({ page }) => {
  await page.goto("/konstruktor");
  const text = page.locator("#k-text");
  await text.fill("КАВА");
  const buy = page.getByRole("button", { name: "Купити" }).first();
  await expect(buy).toBeEnabled();
  await buy.click();

  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  await expect(cart).toContainText("КАВА");
  await expect(cart).toContainText("₴");
  await expect(cart).not.toContainText("м²");
});

test("business sign: the mounting template adds the same price on the page and in the cart", async ({ page }) => {
  await page.goto("/vyvisky");
  // Ø50 cm ready size: 4 200 ₴; template 0.25 m² × 600 ₴ = 150 ₴.
  await page.locator("#bs-size-500x500").click();
  await expect(page.getByText("4 200 ₴").first()).toBeVisible();
  await page.locator("#bs-tpl").check();
  await expect(page.getByText("Монтажний трафарет", { exact: true })).toBeVisible();
  await expect(page.getByText("4 350 ₴").first()).toBeVisible();
  await page.getByRole("button", { name: "В кошик" }).first().click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  await expect(cart).toContainText("4 350 ₴");
});
