// Cabinet routes of the mock shop (/store/tl-account). Telegram data with hash "e2e-valid" and
// the Google code "e2e-code" sign in customer cus_e2e; its session is signed like the real one
// (web/lib/account/account-token.ts) with the test INTERNAL_API_TOKEN, so the storefront's
// checkout token route works too. The customer has one delivered order with a catalogue line
// that can be repeated and a line that cannot.

import { createHmac } from "node:crypto";

export const E2E_SECRET = "e2e-internal-token";
const CUSTOMER = { id: "cus_e2e", firstName: "Олена", lastName: "Коваленко", email: null, provider: "telegram" };
const SESSION_TTL_S = 30 * 24 * 60 * 60;

function session() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const sig = createHmac("sha256", E2E_SECRET).update(`account-session:${CUSTOMER.id}:${expires}`).digest("base64url").slice(0, 32);
  return `${CUSTOMER.id}.${expires}.${sig}`;
}

const sessionOk = (value) => typeof value === "string" && value.startsWith(`${CUSTOMER.id}.`);

function orders() {
  return [{
    id: "order_e2e_1",
    number: "TL-1042",
    createdAt: "2026-10-01T09:30:00.000Z",
    total: 520,
    stage: "shipped",
    statusText: "Відправлено",
    ttn: "20450012345678",
    trackingUrl: "https://novaposhta.ua/tracking/?cargo_number=20450012345678",
    items: [
      {
        title: "Трафарет для торта «Троянди», 20 × 20 см · PET 0,5 мм",
        quantity: 2,
        unitPrice: 170,
        thumbnail: null,
        priceNow: 180,
        repeatProblem: null,
        repeat: {
          key: "cat|variant_1_0|{}", title: "Трафарет для торта «Троянди», 20 × 20 см · PET 0,5 мм", kind: "catalog", materialId: "pet_thin",
          widthCm: 20, heightCm: 20, quantity: 2, variantId: "variant_1_0", basePrice: 180,
        },
      },
      { title: "Вивіска за старим макетом", quantity: 1, unitPrice: 180, thumbnail: null, priceNow: null, repeat: null, repeatProblem: "Цей товар можна замовити знову через менеджера" },
    ],
  }];
}

/** Answers a cabinet request, or returns false when the path is not a cabinet route. */
export async function accountRoute(req, url, readJson, send, res) {
  if (req.method === "POST" && url.pathname === "/store/tl-account/telegram") {
    const { data } = await readJson(req);
    if (data?.hash !== "e2e-valid") return send(res, 401, { message: "Telegram login is not valid" }), true;
    return send(res, 200, { session: session(), customer: CUSTOMER }), true;
  }
  if (req.method === "POST" && url.pathname === "/store/tl-account/google") {
    const { code } = await readJson(req);
    if (code !== "e2e-code") return send(res, 401, { message: "Google did not confirm the sign-in" }), true;
    return send(res, 200, { session: session(), customer: { ...CUSTOMER, email: "olena@example.com", provider: "google" } }), true;
  }
  if (req.method === "GET" && url.pathname === "/store/tl-account/orders") {
    if (!sessionOk(req.headers["x-tl-account"])) return send(res, 401, { message: "Sign in first" }), true;
    return send(res, 200, { customer: CUSTOMER, orders: orders() }), true;
  }
  return false;
}
