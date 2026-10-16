// Phone width: pages fit the screen, and the cart opened from a constructor stays on top of
// the constructor's sticky buy bar (QA 2026-10-16: the bar covered «Оформити»).

import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

for (const path of ["/", "/catalog", "/konstruktor", "/vyvisky/vkazivnyky", "/zahotovky", "/checkout"]) {
  test(`no horizontal scroll at 360 px: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(360);
  });
}

test("cart from the constructor covers the sticky buy bar", async ({ page }) => {
  await page.goto("/konstruktor");
  await page.locator("#k-text").fill("КАВА");
  await page.getByRole("button", { name: "Купити" }).last().click();
  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  const checkout = cart.getByRole("button", { name: /Оформити/ });
  await expect(checkout).toBeVisible();
  // The drawer slides in, so the button's place is read again until it settles.
  await expect.poll(async () => {
    const box = await checkout.boundingBox();
    if (!box) return "";
    return page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("button")?.textContent ?? "", [box.x + box.width / 2, box.y + box.height / 2]);
  }).toContain("Оформити");
});
