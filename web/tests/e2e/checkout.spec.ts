// Cart and checkout: required fields, Nova Poshta city, branch and delivery price, then the
// order goes to the shop. Cash on delivery ends on «Дякуємо», card payment hands the signed
// form to WayForPay (answered here by a test page, no money moves).

import { expect, test } from "@playwright/test";
import { BRANCH_5, KYIV, mockNovaPoshta } from "./support/nova-poshta";
import { addRoseStencil, clearOrders, receivedOrders } from "./support/shop";

test.beforeEach(async ({ request }) => {
  await clearOrders(request);
});

async function fillContactsAndDelivery(page: import("@playwright/test").Page): Promise<void> {
  await page.locator("#c-phone").fill("+380 67 123 45 67");
  await page.locator("#c-name").fill("Олена Коваленко");
  await page.locator("#c-city").fill("Киї");
  await page.getByRole("option", { name: KYIV.label }).click();
  await page.locator("#c-wh").selectOption(BRANCH_5.ref);
}

test("cart opens checkout with the same lines", async ({ page }) => {
  await addRoseStencil(page);
  await page.getByRole("dialog", { name: "Кошик" }).getByRole("button", { name: /Оформити/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  const summary = page.getByRole("complementary", { name: "Ваше замовлення" });
  await expect(summary).toContainText("Трафарет для торта «Троянди», 20 × 20 см, PET 0,5 мм");
  await expect(summary).toContainText("180 ₴");
});

test("empty required fields are shown before the order is sent", async ({ page, request }) => {
  await addRoseStencil(page);
  await page.goto("/checkout");
  await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
  await expect(page.locator("#c-phone")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#c-phone")).toBeFocused();
  expect(await receivedOrders(request)).toHaveLength(0);
});

test("cash on delivery: Nova Poshta branch, delivery price, thank-you page", async ({ page, request }) => {
  const np = await mockNovaPoshta(page);
  await addRoseStencil(page);
  await page.goto("/checkout");
  await fillContactsAndDelivery(page);
  await page.getByRole("radio", { name: "Накладений платіж при отриманні" }).check();
  await expect(page.getByRole("complementary", { name: "Ваше замовлення" })).toContainText("80 ₴");
  expect(np.priceRequests.length).toBeGreaterThan(0);

  await page.getByRole("button", { name: /Підтвердити замовлення · 180 ₴/ }).click();
  await expect(page.getByRole("heading", { name: /Дякуємо! Замовлення TL-1001/ })).toBeVisible();
  await expect(page.getByText(/Сума замовлення: .*, оплата при отриманні/)).toBeVisible();

  const [order] = await receivedOrders(request);
  expect(order.body.payment).toBe("cod");
  expect(order.body.contact).toEqual({ phone: "+380 67 123 45 67", name: "Олена Коваленко" });
  expect(order.body.delivery).toMatchObject({ method: "np_branch", city: KYIV.label, cityRef: KYIV.cityRef, warehouseRef: BRANCH_5.ref });
  expect(order.body.lines).toEqual([expect.objectContaining({ kind: "catalog", variantId: "variant_1_0", quantity: 1 })]);

  // The cart is empty after the order, so a reload cannot send it twice.
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "У кошику порожньо" })).toBeVisible();
});

test("card payment hands the signed order to WayForPay", async ({ page, request }) => {
  await mockNovaPoshta(page);
  let posted = "";
  await page.route("https://secure.wayforpay.com/pay", (route) => {
    posted = route.request().postData() ?? "";
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><title>WayForPay</title><h1>Тестова оплата WayForPay</h1>" });
  });
  await addRoseStencil(page);
  await page.goto("/checkout");
  await fillContactsAndDelivery(page);
  await expect(page.getByRole("radio", { name: /Карткою онлайн/ })).toBeChecked();
  await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();

  await expect(page.getByRole("heading", { name: "Тестова оплата WayForPay" })).toBeVisible();
  const fields = new URLSearchParams(posted);
  expect(fields.get("orderReference")).toBe("TL-1001");
  expect(fields.get("merchantSignature")).toBe("e2e-signature");
  expect(fields.getAll("productName[]")).toEqual(["Трафарет для торта «Троянди», 20 × 20 см, PET 0,5 мм"]);

  const [order] = await receivedOrders(request);
  expect(order.body.payment).toBe("card");
});

test("payment that cannot start keeps the order and offers a retry", async ({ page }) => {
  await mockNovaPoshta(page);
  await page.route("**/store/tl-pay/wayforpay", (route) => route.fulfill({ status: 502, json: { error: "upstream" } }));
  await addRoseStencil(page);
  await page.goto("/checkout");
  await fillContactsAndDelivery(page);
  await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
  await expect(page.getByRole("heading", { name: "Оплата не запустилася" })).toBeVisible();
  await expect(page.getByText(/Замовлення TL-1001 збережено/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Спробувати оплатити ще раз" })).toBeVisible();
});
