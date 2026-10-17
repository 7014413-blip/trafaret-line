// Customer cabinet: sign-in with Google (Google's page is replaced here) and Telegram (its
// return page gets the mock shop's test data), «Мої замовлення» with the parcel number,
// «Повторити замовлення» into the cart, the order of a signed-in buyer carrying the account
// token, and «Вийти».

import { expect, test, type Page } from "@playwright/test";
import { addRoseStencil, clearOrders, receivedOrders } from "./support/shop";
import { fillContactsAndDelivery } from "./support/checkout-form";

const telegramHash = (data: Record<string, unknown>) => `#tgAuthResult=${Buffer.from(JSON.stringify(data), "utf8").toString("base64")}`;

async function signInWithTelegram(page: Page): Promise<void> {
  await page.goto(`/kabinet/vhid-telegram${telegramHash({ id: 42, first_name: "Олена", auth_date: 1_800_000_000, hash: "e2e-valid" })}`);
  await expect(page.getByRole("heading", { name: "Мої замовлення" })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await clearOrders(request);
});

test("signed out: Google and Telegram buttons, no orders", async ({ page }) => {
  await page.goto("/kabinet");
  await expect(page.getByRole("heading", { name: "Вхід у кабінет" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Увійти через Google" })).toBeVisible();
  const telegram = page.getByRole("link", { name: "Увійти через Telegram" });
  const href = new URL((await telegram.getAttribute("href")) ?? "");
  expect(href.origin).toBe("https://oauth.telegram.org");
  expect(href.searchParams.get("bot_id")).toBe("123456789");
  expect(href.searchParams.get("return_to")).toMatch(/\/kabinet\/vhid-telegram$/);
  await expect(page.getByRole("heading", { name: "Мої замовлення" })).toHaveCount(0);
});

test("Google sign-in checks the state and shows the orders", async ({ page }) => {
  // The button starts the sign-in; Google's page itself is not opened in the test: the redirect
  // is read with the page's own cookies, then the test comes back with Google's answer.
  const start = async () => {
    const response = await page.request.get("/api/kabinet/google/start", { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    return new URL(response.headers().location);
  };
  await page.goto("/kabinet");
  await expect(page.locator('form[action="/api/kabinet/google/start"]')).toBeAttached();
  const google = await start();
  expect(google.origin + google.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
  expect(google.searchParams.get("client_id")).toBe("e2e-client.apps.googleusercontent.com");
  expect(google.searchParams.get("redirect_uri")).toMatch(/\/api\/kabinet\/google\/callback$/);
  expect((google.searchParams.get("state") ?? "").length).toBeGreaterThan(20);

  // Someone else's state is refused.
  await page.goto("/api/kabinet/google/callback?code=e2e-code&state=forged-state-value-000000");
  await expect(page).toHaveURL(/\/kabinet\?pomylka=google$/);
  await expect(page.getByText("Google не підтвердив вхід. Спробуйте ще раз.")).toBeVisible();

  // The state cookie is gone after a refusal: start again, then come back with Google's answer.
  const fresh = (await start()).searchParams.get("state") ?? "";
  await page.goto(`/api/kabinet/google/callback?code=e2e-code&state=${encodeURIComponent(fresh)}`);
  await expect(page).toHaveURL(/\/kabinet$/);
  await expect(page.getByRole("heading", { name: "Мої замовлення" })).toBeVisible();
});

test("Telegram sign-in with wrong data shows an error", async ({ page }) => {
  await page.goto(`/kabinet/vhid-telegram${telegramHash({ id: 42, auth_date: 1_800_000_000, hash: "forged" })}`);
  await expect(page).toHaveURL(/\/kabinet\?pomylka=telegram$/);
  await expect(page.getByText("Telegram не підтвердив вхід. Спробуйте ще раз.")).toBeVisible();
});

test("orders, repeat into the cart, checkout into the cabinet, sign out", async ({ page, request }) => {
  await signInWithTelegram(page);
  const order = page.getByRole("article", { name: "Замовлення TL-1042" });
  await expect(order).toContainText("Відправлено");
  await expect(order).toContainText("20450012345678");
  await expect(order.getByRole("link", { name: "Де посилка?" })).toHaveAttribute("href", "https://novaposhta.ua/tracking/?cargo_number=20450012345678");
  await expect(order).toContainText("зараз 180 ₴");
  await expect(order).toContainText("Цей товар можна замовити знову через менеджера");

  await order.getByRole("button", { name: "Повторити замовлення TL-1042" }).click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toContainText("Трафарет для торта «Троянди»");
  await expect(cart.locator("output").first()).toHaveText("2");

  await page.goto("/checkout");
  await fillContactsAndDelivery(page);
  await page.getByRole("radio", { name: "Накладений платіж при отриманні" }).check();
  await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
  await expect(page.getByRole("heading", { name: /Дякуємо! Замовлення/ })).toBeVisible();
  const [placed] = await receivedOrders(request);
  expect(placed.body.accountToken).toMatch(/^cus_e2e\.\d+\.[A-Za-z0-9_-]{32}$/);
  expect(placed.body.lines).toEqual([expect.objectContaining({ kind: "catalog", variantId: "variant_1_0", quantity: 2 })]);

  await page.goto("/kabinet");
  await page.getByRole("button", { name: "Вийти" }).click();
  await expect(page.getByRole("heading", { name: "Вхід у кабінет" })).toBeVisible();
});

test("a guest's order carries no account token", async ({ page, request }) => {
  await addRoseStencil(page);
  await page.goto("/checkout");
  await fillContactsAndDelivery(page);
  await page.getByRole("radio", { name: "Накладений платіж при отриманні" }).check();
  await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
  await expect(page.getByRole("heading", { name: /Дякуємо! Замовлення/ })).toBeVisible();
  const [placed] = await receivedOrders(request);
  expect(placed.body.accountToken).toBeUndefined();
});
