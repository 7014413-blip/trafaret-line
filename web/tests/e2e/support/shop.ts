// Shared steps of the buying tests: the mock shop's received orders and putting a catalogue
// stencil into the cart the way a customer does.

import { expect, type APIRequestContext, type Page } from "@playwright/test";

const MOCK_MEDUSA = "http://127.0.0.1:9100";

export interface ReceivedOrder {
  order: { id: string; number: string; total: number };
  body: {
    lines: { kind: string; title: string; quantity: number; variantId?: string; pointer?: unknown; previewSvg?: string }[];
    contact: { phone: string; name: string };
    delivery: { method: string; city: string; cityRef?: string; warehouse?: string; warehouseRef?: string };
    payment: string;
    layoutApproved?: boolean;
    accountToken?: string;
    utm?: Record<string, string>;
  };
}

export async function clearOrders(request: APIRequestContext): Promise<void> {
  await request.delete(`${MOCK_MEDUSA}/__e2e/orders`);
}

export async function receivedOrders(request: APIRequestContext): Promise<ReceivedOrder[]> {
  const response = await request.get(`${MOCK_MEDUSA}/__e2e/orders`);
  return ((await response.json()) as { orders: ReceivedOrder[] }).orders;
}

/** Opens the rose stencil, picks 20 × 20 cm in PET and adds it to the cart; the cart drawer opens. */
export async function addRoseStencil(page: Page, quantity = 1): Promise<void> {
  await page.goto("/p/trafaret-troiandy");
  await page.getByRole("radio", { name: /20 × 20 см/ }).click();
  await page.getByRole("radio", { name: "PET 0,5 мм" }).check();
  if (quantity > 1) await page.getByRole("spinbutton", { name: "Кількість" }).fill(String(quantity));
  await page.getByRole("button", { name: "Купити" }).first().click();
  await expect(page.getByRole("dialog", { name: "Кошик" })).toBeVisible();
}
