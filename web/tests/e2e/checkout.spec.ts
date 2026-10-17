// Cart and checkout: required fields, Nova Poshta city, branch and delivery price (answered by
// the mock shop with data/knowledge_base/mock_novaposhta.json), then the order goes to the
// shop. Cash on delivery ends on «Дякуємо», card payment hands the signed form to WayForPay
// (answered here by a test page, no money moves).

import { expect, test } from "@playwright/test";
import { BRANCH, DELIVERY, KYIV, LOCKER } from "./support/nova-poshta";
import { addRoseStencil, clearOrders, receivedOrders } from "./support/shop";
import { fillContactsAndDelivery } from "./support/checkout-form";

test.beforeEach(async ({ request }) => {
  await clearOrders(request);
});

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
  await addRoseStencil(page);
  await page.goto("/checkout");
  await fillContactsAndDelivery(page);
  await page.getByRole("radio", { name: "Накладений платіж при отриманні" }).check();
  // Delivery and the cash-on-delivery fee, as Nova Poshta quoted them.
  await expect(page.getByRole("complementary", { name: "Ваше замовлення" })).toContainText(`${DELIVERY.cost + DELIVERY.codFee} ₴`);

  await page.getByRole("button", { name: /Підтвердити замовлення · 180 ₴/ }).click();
  await expect(page.getByRole("heading", { name: /Дякуємо! Замовлення TL-1001/ })).toBeVisible();
  await expect(page.getByText(/Сума замовлення: .*, оплата при отриманні/)).toBeVisible();

  const [order] = await receivedOrders(request);
  expect(order.body.payment).toBe("cod");
  expect(order.body.contact).toEqual({ phone: "+380 67 123 45 67", name: "Олена Коваленко" });
  expect(order.body.delivery).toMatchObject({ method: "np_branch", city: KYIV.label, cityRef: KYIV.cityRef, warehouse: BRANCH.label, warehouseRef: BRANCH.ref });
  expect(order.body.lines).toEqual([expect.objectContaining({ kind: "catalog", variantId: "variant_1_0", quantity: 1 })]);

  // The cart is empty after the order, so a reload cannot send it twice.
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "У кошику порожньо" })).toBeVisible();
});

test("card payment hands the signed order to WayForPay", async ({ page, request }) => {
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
  await page.route("**/store/tl-pay/wayforpay", (route) => route.fulfill({ status: 502, json: { error: "upstream" } }));
  await addRoseStencil(page);
  await page.goto("/checkout");
  await fillContactsAndDelivery(page);
  await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
  await expect(page.getByRole("heading", { name: "Оплата не запустилася" })).toBeVisible();
  await expect(page.getByText(/Замовлення TL-1001 збережено/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Спробувати оплатити ще раз" })).toBeVisible();
});

test("own text stencil: the order waits for «Макет перевірив»", async ({ page, request }) => {
  await page.goto("/konstruktor");
  await page.locator("#k-text").fill("КАВА");
  const buy = page.getByRole("button", { name: "Купити" }).first();
  await expect(buy).toBeEnabled();
  await buy.click();
  await page.goto("/checkout");
  await fillContactsAndDelivery(page);
  await page.getByRole("radio", { name: "Накладений платіж при отриманні" }).check();

  const approval = page.getByRole("group", { name: "Погодження макета" });
  await expect(approval).toContainText("КАВА");
  await expect(approval.getByRole("img", { name: /Макет: Свій напис «КАВА»/ })).toBeVisible();
  const confirm = page.getByRole("button", { name: /Підтвердити замовлення/ });
  await expect(confirm).toBeDisabled();

  await page.getByLabel(/Макет перевірив/).check();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByRole("heading", { name: /Дякуємо! Замовлення TL-1001/ })).toBeVisible();

  const [order] = await receivedOrders(request);
  expect(order.body.layoutApproved).toBe(true);
  expect(order.body.lines).toEqual([expect.objectContaining({ kind: "stencil", previewSvg: expect.stringMatching(/^<svg/) })]);
});

test("a rigid stencil longer than a locker cell is not offered parcel lockers", async ({ page }) => {
  // Thin PET rolls into a short tube that fits a locker; 3 mm acrylic goes flat in a 94 cm box.
  await page.goto("/konstruktor");
  await page.locator("#k-text").fill("КАВА");
  await page.locator("#k-width").fill("90");
  await page.locator("#k-mat-acrylic").check();
  const buy = page.getByRole("button", { name: "Купити" }).first();
  await expect(buy).toBeEnabled();
  await buy.click();
  await page.goto("/checkout");
  await expect(page.getByRole("radio", { name: /^Нова пошта: відділення за/ })).toBeChecked();
  await page.locator("#c-city").fill("Киї");
  await page.getByRole("option", { name: KYIV.label }).click();
  await expect(page.locator("#c-wh").getByRole("option", { name: BRANCH.option })).toBeAttached();
  await expect(page.locator("#c-wh").getByRole("option", { name: LOCKER.option })).toHaveCount(0);
  await expect(page.getByText(/Посилка більша за комірку поштомата/)).toBeVisible();
});
