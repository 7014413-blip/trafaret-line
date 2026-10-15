// Nova Poshta answers for the checkout tests: the site's own /api/novaposhta routes are
// answered in the browser, so the city search, the branch list and the delivery price work
// without the Nova Poshta key.

import type { Page } from "@playwright/test";
import type { NpCity, NpPriceResult, NpWarehouse } from "../../../types/integrations";

export const KYIV: NpCity = {
  cityRef: "city-kyiv", settlementRef: "settlement-kyiv", label: "м. Київ, Київська обл.", name: "Київ", area: "Київська", warehouses: 2,
};

export const BRANCH_5: NpWarehouse = {
  ref: "wh-kyiv-5", number: "5", label: "Відділення №5: вул. Хрещатик, 22", shortAddress: "вул. Хрещатик, 22",
  category: "branch", maxWeightKg: 30, maxDimensionsMm: null, fits: true,
};

const POSTOMAT: NpWarehouse = {
  ref: "wh-kyiv-pm", number: "1001", label: "Поштомат №1001: вул. Велика Васильківська, 1", shortAddress: "вул. Велика Васильківська, 1",
  category: "postomat", maxWeightKg: 20, maxDimensionsMm: { length: 600, width: 400, height: 400 }, fits: true,
};

export const DELIVERY_QUOTE: NpPriceResult = { deliveryCost: 80, codFee: 0, deliveryDate: "2026-10-22" };

/** Answers city search, branches and price; returns the price requests the page made. */
export async function mockNovaPoshta(page: Page): Promise<{ priceRequests: unknown[] }> {
  const priceRequests: unknown[] = [];
  await page.route("**/api/novaposhta/cities**", (route) => route.fulfill({ json: { cities: [KYIV] } }));
  await page.route("**/api/novaposhta/warehouses**", (route) => route.fulfill({ json: { warehouses: [BRANCH_5, POSTOMAT] } }));
  await page.route("**/api/novaposhta/price", (route) => {
    priceRequests.push(route.request().postDataJSON());
    return route.fulfill({ json: DELIVERY_QUOTE });
  });
  return { priceRequests };
}
