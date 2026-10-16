// Reviews (ТЗ §4.10): a product page shows published reviews with the average and photos, the
// «Відгуки» page lists them all, and a buyer leaves a review with stars and a photo by the link
// of a received order.

import path from "node:path";
import { expect, test } from "@playwright/test";

const MOCK_MEDUSA = "http://127.0.0.1:9100";
const PHOTO = path.resolve(__dirname, "../../public/demo/cake-stencil.jpg");

test("a product page shows its reviews, the average and real rating markup", async ({ page }) => {
  await page.goto("/p/trafaret-troiandy");
  const section = page.locator("#vidguky");
  await expect(section.getByTestId("review-summary")).toContainText("4,5");
  await expect(section.getByTestId("review-summary")).toContainText("2 відгуки");
  await expect(section.getByTestId("review")).toHaveCount(2);
  await expect(section).toContainText("Трафарет щільно лягає на торт");
  await expect(section).toContainText("Відповідь Trafaret Line: Дякуємо, Олено!");
  await expect(section.getByRole("img", { name: "Фото покупця 1" })).toBeVisible();
  // A review text is shown as text, never as HTML, and cannot close the JSON-LD block.
  await expect(section).toContainText("Все добре </script><b>жирно</b>");
  await expect(page.locator("b", { hasText: "жирно" })).toHaveCount(0);
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const product = ld.map((t) => JSON.parse(t)).find((d) => d["@type"] === "ProductGroup");
  expect(product.aggregateRating).toMatchObject({ ratingValue: 4.5, reviewCount: 2 });
  expect(product.review).toHaveLength(2);
});

test("the «Відгуки» page lists every review with its product", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Відгуки" }).first().click();
  await expect(page).toHaveURL(/\/vidguky$/);
  await expect(page.getByRole("heading", { level: 1, name: "Відгуки покупців" })).toBeVisible();
  await expect(page.getByTestId("review")).toHaveCount(2);
  await page.getByRole("link", { name: "Трафарет троянди" }).first().click();
  await expect(page).toHaveURL(/\/p\/trafaret-troiandy$/);
});

test("a buyer reviews a received order with stars and a photo", async ({ page, request }) => {
  await request.delete(`${MOCK_MEDUSA}/__e2e/reviews`);
  await page.goto("/vidguk/order_review?t=e2e-review");
  await expect(page.getByText("Замовлення TL-2001")).toBeVisible();

  await page.getByRole("button", { name: "Надіслати відгук" }).click();
  await expect(page.getByText("Поставте оцінку від 1 до 5 зірок")).toBeVisible();

  await page.getByRole("radio", { name: "5 з 5 — Чудово" }).check({ force: true });
  await page.getByLabel("Ваш відгук").fill("Чудовий трафарет, торт вийшов дуже гарний!");
  await page.getByLabel("Імʼя").fill("Марія");
  await page.getByLabel("Місто").fill("Львів");
  await page.getByLabel(/Фото результату/).setInputFiles(PHOTO);
  await expect(page.getByRole("img", { name: "Ваше фото 1" })).toBeVisible();
  await page.getByRole("button", { name: "Надіслати відгук" }).click();
  await expect(page.getByText("Дякуємо! Відгук зʼявиться на сайті після перевірки.")).toBeVisible();
  await expect(page.getByText("Відгук надіслано")).toBeVisible();

  // The next subject (the order as a whole) is offered; the name stays.
  await page.getByRole("radio", { name: "4 з 5 — Добре" }).check({ force: true });
  await page.getByLabel("Ваш відгук").fill("Швидко відправили, дякую.");
  await page.getByRole("button", { name: "Надіслати відгук" }).click();
  await expect(page.getByRole("heading", { name: "Дякуємо за відгук!" })).toBeVisible();

  const { reviews } = (await (await request.get(`${MOCK_MEDUSA}/__e2e/reviews`)).json()) as { reviews: { key: string; rating: number; name: string; city: string; photos: string[] }[] };
  expect(reviews).toHaveLength(2);
  expect(reviews[0]).toMatchObject({ key: "trafaret-troiandy", rating: 5, name: "Марія", city: "Львів" });
  expect(reviews[0].photos).toHaveLength(1);
  // A JPEG reduced in the browser: starts with the JPEG marker and has no EXIF block.
  const jpeg = Buffer.from(reviews[0].photos[0], "base64");
  expect(jpeg.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  expect(jpeg.includes(Buffer.from("Exif\0\0"))).toBe(false);
  expect(reviews[1]).toMatchObject({ key: "order", rating: 4 });
});

test("a wrong review link explains what to do", async ({ page }) => {
  await page.goto("/vidguk/order_review?t=wrong");
  await expect(page.getByText("Посилання недійсне або застаріло")).toBeVisible();
  await expect(page.getByRole("button", { name: "Надіслати відгук" })).toHaveCount(0);
});
