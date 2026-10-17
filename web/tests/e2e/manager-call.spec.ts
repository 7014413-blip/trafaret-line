// «Подзвонити Наталі»: one tap calls the manager from the header (phone and desktop), the
// contacts page and the consultant chat.

import { expect, test } from "@playwright/test";

const CALL = /Подзвонити менеджеру Наталі/;
const TEL = "tel:+380662819720";

test("desktop: the header and the contacts page call the manager", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header").first().getByRole("link", { name: CALL });
  await expect(header).toBeVisible();
  await expect(header).toHaveAttribute("href", TEL);
  await expect(header).toContainText("+38 066 281 97 20");

  await page.goto("/kontakty");
  const card = page.locator("main").getByRole("link", { name: CALL });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("href", TEL);
});

test("consultant chat has the call link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Запитати консультанта" }).click();
  const call = page.getByRole("dialog", { name: "Консультант Trafaret Line" }).getByRole("link", { name: CALL });
  await expect(call).toBeVisible();
  await expect(call).toHaveAttribute("href", TEL);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test("the header call button is one tap away", async ({ page }) => {
    await page.goto("/");
    const call = page.locator("header").first().getByRole("link", { name: CALL });
    await expect(call).toBeVisible();
    await expect(call).toHaveAttribute("href", TEL);
    const box = await call.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
