// Mock of the Medusa backend for end-to-end tests. It answers the Store API calls the
// storefront makes (regions, categories, products, product photos), takes orders at
// POST /store/tl-checkout and signs a WayForPay form at POST /store/tl-pay/wayforpay without
// real keys. It also stands in for the Nova Poshta API at POST /novaposhta/ with the answers
// of data/knowledge_base/mock_novaposhta.json (the site's server calls it via NP_API_URL), and
// answers the cabinet routes (account.mjs). Orders it received are listed at GET /__e2e/orders, so a test can check what the
// browser sent; DELETE /__e2e/orders clears the list. Reviews: published ones at GET /store/tl-reviews,
// the review form of one order (reviews.mjs) and the reviews it received at GET /__e2e/reviews.
//
// Usage: node tests/e2e/mock-medusa/server.mjs (port from MOCK_MEDUSA_PORT, default 9100).

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, REGION, products } from "./catalog.mjs";
import { accountRoute } from "./account.mjs";
import { REVIEW_ORDER, reviewList, reviewOrder } from "./reviews.mjs";

const PORT = Number(process.env.MOCK_MEDUSA_PORT ?? 9100);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PHOTO = path.resolve(HERE, "../../../public/demo/cake-stencil.jpg");
const NOVA_POSHTA = JSON.parse(fs.readFileSync(path.resolve(HERE, "../../../data/knowledge_base/mock_novaposhta.json"), "utf8"));
const WAYFORPAY_URL = "https://secure.wayforpay.com/pay";

const orders = [];
const reviews = [];

function send(res, status, body, type = "application/json") {
  res.writeHead(status, {
    "content-type": type,
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, x-publishable-api-key",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function listProducts(query) {
  let list = products(ORIGIN);
  const handles = [...query.getAll("handle"), ...query.getAll("handle[]")];
  const categoryIds = query.getAll("category_id[]");
  const q = query.get("q");
  if (handles.length) list = list.filter((p) => handles.includes(p.handle));
  if (categoryIds.length) list = list.filter((p) => p.categories.some((c) => categoryIds.includes(c.id)));
  if (q) list = list.filter((p) => `${p.title} ${p.description} ${p.handle}`.toLowerCase().includes(q.toLowerCase()));
  return { products: list, count: list.length, offset: 0, limit: list.length };
}

// The real backend recomputes every price; the mock charges a flat 150 ₴ a piece.
function placeOrder(body) {
  const number = `TL-${String(1001 + orders.length)}`;
  const total = (body.lines ?? []).reduce((sum, line) => sum + (line.quantity ?? 1) * 150, 0);
  const order = { id: `order_${orders.length + 1}`, number, total, invoiceToken: body.payment === "invoice" ? "e2e-token" : null };
  orders.push({ order, body });
  return order;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ORIGIN);
  try {
    if (req.method === "OPTIONS") return send(res, 204, "", "text/plain");
    if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
    if (req.method === "GET" && url.pathname === "/store/regions") return send(res, 200, { regions: [REGION] });
    if (req.method === "GET" && url.pathname === "/store/product-categories") return send(res, 200, { product_categories: CATEGORIES });
    if (req.method === "GET" && url.pathname === "/store/products") return send(res, 200, listProducts(url.searchParams));
    if (req.method === "GET" && url.pathname.startsWith("/static/")) return send(res, 200, fs.readFileSync(PHOTO), "image/jpeg");
    if (req.method === "GET" && url.pathname === "/store/tl-reviews") return send(res, 200, reviewList(ORIGIN, url.searchParams));
    if (req.method === "GET" && url.pathname.startsWith("/tl-media/reviews/")) return send(res, 200, fs.readFileSync(PHOTO), "image/jpeg");
    if (url.pathname === `/store/tl-reviews/order/${REVIEW_ORDER.id}`) {
      if (url.searchParams.get("t") !== REVIEW_ORDER.token) return send(res, 404, { message: "Посилання недійсне" });
      if (req.method === "GET") return send(res, 200, reviewOrder(reviews));
      const body = await readJson(req);
      if (reviews.some((r) => r.key === body.key)) return send(res, 409, { message: "Відгук на цей товар уже надіслано. Дякуємо!" });
      reviews.push(body);
      return send(res, 200, { ok: true, status: "pending" });
    }
    if (url.pathname === "/__e2e/reviews") {
      if (req.method === "DELETE") reviews.length = 0;
      return send(res, 200, { reviews });
    }
    if (req.method === "POST" && url.pathname === "/store/tl-checkout") {
      const body = await readJson(req);
      if (!Array.isArray(body.lines) || body.lines.length === 0) return send(res, 400, { errors: ["empty_cart"] });
      return send(res, 200, { order: placeOrder(body) });
    }
    if (req.method === "POST" && url.pathname === "/store/tl-pay/wayforpay") {
      const { order_id: orderId, lang } = await readJson(req);
      const placed = orders.find((o) => o.order.id === orderId);
      if (!placed) return send(res, 404, { error: "not_found" });
      return send(res, 200, {
        url: WAYFORPAY_URL,
        fields: {
          merchantAccount: "e2e_merchant", orderReference: placed.order.number, amount: placed.order.total, currency: "UAH",
          productName: placed.body.lines.map((l) => l.title), productCount: placed.body.lines.map((l) => l.quantity), merchantSignature: "e2e-signature",
          language: lang === "ru" ? "RU" : lang === "en" ? "EN" : "UA",
        },
      });
    }
    if (url.pathname.startsWith("/store/tl-account/") && (await accountRoute(req, url, readJson, send, res))) return;
    if (req.method === "POST" && url.pathname === "/novaposhta/") {
      const { calledMethod, apiKey } = await readJson(req);
      if (!apiKey) return send(res, 200, NOVA_POSHTA.error);
      return send(res, 200, NOVA_POSHTA[calledMethod] ?? NOVA_POSHTA.error);
    }
    if (url.pathname === "/__e2e/orders") {
      if (req.method === "DELETE") orders.length = 0;
      return send(res, 200, { orders });
    }
    return send(res, 404, { error: "not_found", path: url.pathname });
  } catch (error) {
    return send(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(PORT, "127.0.0.1", () => console.log(`mock medusa on ${ORIGIN}`));
