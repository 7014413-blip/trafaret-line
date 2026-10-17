// A layout link (?draft=…) opens the same layout in another browser: «Свій напис» and the
// business sign. A fresh browser context stands in for the other device (no local storage).

import { expect, test } from "@playwright/test";

test("«Свій напис»: the link opens the same text, width and material elsewhere", async ({ page, browser }) => {
  await page.goto("/konstruktor");
  await page.locator("#k-text").fill("Підʼїзд 3\nОбережно");
  await page.locator("#k-width").fill("90");
  await page.locator("#k-mat-acrylic").check();
  await expect(page).toHaveURL(/[?&]draft=/);
  const link = page.url();

  const other = await browser.newContext();
  const phone = await other.newPage();
  await phone.goto(link);
  await expect(phone.locator("#k-text")).toHaveValue("Підʼїзд 3\nОбережно");
  await expect(phone.locator("#k-width")).toHaveValue("90");
  await expect(phone.locator("#k-mat-acrylic")).toBeChecked();
  await other.close();
});

test("«Свій напис»: an untouched constructor keeps a clean address, a broken link opens the default", async ({ page }) => {
  await page.goto("/konstruktor");
  await expect(page.locator("#k-text")).toBeVisible();
  await page.waitForTimeout(800);
  expect(page.url()).not.toContain("draft=");

  await page.goto("/konstruktor?draft=bm90LWEtZHJhZnQ");
  await expect(page.locator("#k-mat-pet_thin")).toBeChecked();
});

test("business sign: the link opens the same shape, size, text and options elsewhere", async ({ page, browser, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/vyvisky");
  await page.locator("#bs-shape-rect").click();
  await page.locator("#bs-w").fill("70");
  await page.locator("#bs-h").fill("40");
  await page.locator("#bs-line-0").fill("Кавʼярня");
  await page.locator("#bs-holes-4").click();
  await page.getByRole("button", { name: "Посилання на макет" }).click();
  await expect(page.getByRole("button", { name: "✓ Посилання скопійовано" })).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("/vyvisky?draft=");

  const other = await browser.newContext();
  const phone = await other.newPage();
  await phone.goto(link);
  await expect(phone.locator("#bs-line-0")).toHaveValue("Кавʼярня");
  await expect(phone.locator("#bs-w")).toHaveValue("70");
  await expect(phone.locator("#bs-h")).toHaveValue("40");
  await expect(phone.locator("#bs-shape-rect")).toHaveAttribute("aria-pressed", "true");
  await expect(phone.locator("#bs-holes-4")).toHaveAttribute("aria-pressed", "true");
  await other.close();
});
