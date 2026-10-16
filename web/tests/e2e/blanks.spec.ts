// Blanks configurator «/zahotovky»: shape → size → material and thickness → colour → quantity,
// the wholesale scale before ordering, and the blank design that goes to the shop with the order
// (the server prices it again from that design).

import { expect, test } from "@playwright/test";
import { BRANCH, KYIV, LOCKER } from "./support/nova-poshta";
import { clearOrders, receivedOrders } from "./support/shop";

test.beforeEach(async ({ request }) => {
  await clearOrders(request);
});

test("mirror heart: steps, wholesale price and order", async ({ page, request }) => {
  await page.goto("/zahotovky");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Заготовки");
  // Default: clear acrylic 3 mm circle Ø10 cm.
  await expect(page.getByRole("button", { name: /Ø10 см/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Ціна за шт.: 30 ₴")).toBeVisible();

  await page.locator("#bl-shape-heart").click();
  await page.getByRole("button", { name: /^20 см/ }).click();
  await page.locator("#bl-group-mirror").click();
  await page.locator("#bl-thickness-3").click();
  await page.locator("#bl-colour-rose").click();
  await expect(page.getByRole("img", { name: "Схема заготовки «Серце» 20 см" })).toBeVisible();

  // The scale is visible before the quantity changes: 328 ₴, from 10 pcs 311 ₴.
  const scale = page.getByRole("table", { name: "Ціна за штуку від кількості" });
  await expect(scale).toContainText("1 шт.328 ₴");
  await expect(scale).toContainText("від 10 шт.−5%311 ₴");
  await page.locator("#bl-qty").fill("10");
  await expect(page.getByText("Ціна за шт.: 311 ₴ (−5%)")).toBeVisible();
  await expect(page.getByText("Упаковка 10 шт.: 3 110 ₴")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("м²");

  await page.getByRole("button", { name: "В кошик" }).first().click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toContainText("Заготовка «Серце» 20 см, дзеркальний акрил 3 мм, рожеве золото");
  await expect(cart).toContainText("3 110 ₴");

  await page.goto("/checkout");
  await page.locator("#c-phone").fill("+380 67 123 45 67");
  await page.locator("#c-name").fill("Олена Коваленко");
  await page.locator("#c-city").fill("Киї");
  await page.getByRole("option", { name: KYIV.label }).click();
  await expect(page.locator("#c-wh").getByRole("option", { name: LOCKER.option })).toBeAttached();
  await page.locator("#c-wh").selectOption(BRANCH.ref);
  await page.getByRole("radio", { name: "Накладений платіж при отриманні" }).check();
  await page.getByRole("button", { name: /Підтвердити замовлення · 3 110 ₴/ }).click();
  await expect(page.getByRole("heading", { name: /Дякуємо!/ })).toBeVisible();

  const [order] = await receivedOrders(request);
  expect(order.body.lines).toEqual([expect.objectContaining({
    kind: "blank", quantity: 10,
    blank: { shapeId: "heart", widthMm: 200, heightMm: 200, materialId: "acrylic_mirror_3", colourId: "rose", quantity: 10 },
  })]);
});

test("cake boards are described without food-contact claims", async ({ page }) => {
  await page.goto("/zahotovky");
  await page.locator("#bl-group-board").click();
  await expect(page.locator("#bl-thickness-0-5")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).not.toContainText(/харчов|сертифік/i);
});

test("own rectangle size is cut to whole millimetres inside the limits", async ({ page }) => {
  await page.goto("/zahotovky");
  await page.locator("#bl-shape-rect").click();
  await page.locator("#bl-size-custom").click();
  await page.locator("#bl-w").fill("12.34");
  await page.locator("#bl-h").fill("500");
  await page.locator("#bl-h").blur();
  await expect(page.locator("#bl-w")).toHaveValue("12.3");
  await expect(page.locator("#bl-h")).toHaveValue("100");
  await expect(page.getByRole("img", { name: "Схема заготовки «Прямокутник» 12,3×100 см" })).toBeVisible();
});
