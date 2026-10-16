// Contacts and a Nova Poshta branch on /checkout, filled the way a customer does (the city and
// branch lists come from the mock shop's Nova Poshta answers).

import { expect, type Page } from "@playwright/test";
import { BRANCH, KYIV, LOCKER } from "./nova-poshta";

export async function fillContactsAndDelivery(page: Page): Promise<void> {
  await page.locator("#c-phone").fill("+380 67 123 45 67");
  await page.locator("#c-name").fill("Олена Коваленко");
  await page.locator("#c-city").fill("Киї");
  await page.getByRole("option", { name: KYIV.label }).click();
  await expect(page.locator("#c-wh").getByRole("option", { name: LOCKER.option })).toBeAttached();
  await page.locator("#c-wh").selectOption(BRANCH.ref);
}
