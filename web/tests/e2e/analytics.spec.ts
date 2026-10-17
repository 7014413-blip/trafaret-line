// Analytics events of a purchase (plan step 9): the page gets an empty GTM dataLayer before it
// loads (no real tags run in tests), the buyer comes from an ad link, and every step of the
// path leaves its GA4 event there; the ad source goes to the shop with the order.

import { expect, test, type Page } from "@playwright/test";
import { addRoseStencil, clearOrders, receivedOrders } from "./support/shop";
import { fillContactsAndDelivery } from "./support/checkout-form";

type Pushed = { event?: string; ecommerce?: { value?: number; transaction_id?: string; items?: { item_id: string; quantity: number }[]; shipping_tier?: string; payment_type?: string }; link_type?: string };

const pushed = (page: Page) => page.evaluate(() => ((window as unknown as { dataLayer: unknown[] }).dataLayer ?? []) as Pushed[]);
const named = (events: Pushed[], name: string) => events.filter((e) => e.event === name);

test.beforeEach(async ({ page, request }) => {
  await clearOrders(request);
  await page.addInitScript(() => { (window as unknown as { dataLayer: unknown[] }).dataLayer ??= []; });
});

test("a purchase from an ad link leaves every e-commerce event and the source in the order", async ({ page, request }) => {
  await page.goto("/food?utm_source=google&utm_medium=cpc&utm_campaign=rozy&gclid=e2e-click");
  await expect.poll(async () => named(await pushed(page), "view_item_list").length).toBe(1);

  await addRoseStencil(page, 2);
  let events = await pushed(page);
  expect(named(events, "view_item")[0].ecommerce?.items?.[0].item_id).toBe("TL-ROSE-00");
  const added = named(events, "add_to_cart")[0].ecommerce;
  expect(added?.items?.[0]).toMatchObject({ item_id: "variant_1_0", quantity: 2 });
  expect(named(events, "view_cart")).toHaveLength(1);

  await page.goto("/checkout");
  await expect.poll(async () => named(await pushed(page), "begin_checkout").length).toBe(1);
  await fillContactsAndDelivery(page);
  await page.getByRole("radio", { name: "Накладений платіж при отриманні" }).check();
  await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
  await expect(page.getByRole("heading", { name: /Дякуємо! Замовлення TL-1001/ })).toBeVisible();

  events = await pushed(page);
  expect(named(events, "add_shipping_info")[0].ecommerce?.shipping_tier).toBe("np_branch");
  expect(named(events, "add_payment_info")[0].ecommerce?.payment_type).toBe("cod");
  const purchase = named(events, "purchase");
  expect(purchase).toHaveLength(1);
  expect(purchase[0].ecommerce).toMatchObject({ transaction_id: "TL-1001", value: 300 });

  const [order] = await receivedOrders(request);
  expect(order.body.utm).toMatchObject({ utm_source: "google", utm_medium: "cpc", utm_campaign: "rozy", gclid: "e2e-click", landing: "/food" });
});

test("a call link is an event", async ({ page }) => {
  await page.goto("/kontakty");
  await page.evaluate(() => document.addEventListener("click", (e) => e.preventDefault()));
  await page.getByRole("link", { name: /Подзвонити менеджеру/ }).first().click();
  expect(named(await pushed(page), "phone_click")[0].link_type).toBe("phone");
});

test("without analytics ids there is no cookie banner and no tag script", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Налаштування cookies" })).toHaveCount(0);
  await expect(page.locator("script[src*='googletagmanager'], script#tl-meta-pixel")).toHaveCount(0);
});
