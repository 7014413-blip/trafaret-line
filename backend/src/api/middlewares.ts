import { defineMiddlewares } from "@medusajs/framework/http";
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { limitRoute } from "../lib/rate-limit";

/** 404 for every guest request; signed-in customers (cabinet, stage 2) pass through. */
function closedForGuests(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction): void {
  const actor = (req as unknown as { auth_context?: { actor_id?: string } }).auth_context?.actor_id;
  if (actor) return next();
  res.status(404).json({ message: "Not found" });
}

// Customer layout uploads come as base64 JSON (up to 25 MB file → ~34 MB body).
// Public routes are rate-limited per address (QA 2026-10-10, M8): uploads 10 per hour and
// 150 MB per hour, checkout 5 orders per 10 minutes and 30 per day.
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/tl-upload",
      method: ["POST"],
      bodyParser: { sizeLimit: "40mb" },
      middlewares: [limitRoute({ name: "upload", limit: 10, windowMs: 60 * 60_000, maxBytes: 150 * 1024 * 1024 })],
    },
    {
      matcher: "/store/tl-checkout",
      method: ["POST"],
      middlewares: [
        limitRoute({ name: "checkout-10m", limit: 5, windowMs: 10 * 60_000 }),
        limitRoute({ name: "checkout-day", limit: 30, windowMs: 24 * 60 * 60_000 }),
      ],
    },
    {
      // The storefront has no customer accounts yet: an order is never shown by its id to a
      // guest (QA m14). The invoice page uses /internal/tl-invoice with the server token.
      matcher: "/store/orders/:id",
      method: ["GET"],
      middlewares: [closedForGuests],
    },
    {
      // Customer fonts: up to 10 MB file as base64; 20 fonts per hour per address.
      matcher: "/store/tl-font",
      method: ["POST"],
      bodyParser: { sizeLimit: "15mb" },
      middlewares: [limitRoute({ name: "font", limit: 20, windowMs: 60 * 60_000, maxBytes: 100 * 1024 * 1024 })],
    },
    {
      // «Простий кабінет»: the Excel table of the whole catalogue comes as one JSON string.
      matcher: "/admin/tl-products/import",
      method: ["POST"],
      bodyParser: { sizeLimit: "32mb" },
    },
    {
      matcher: "/store/tl-pay/wayforpay",
      method: ["POST"],
      middlewares: [limitRoute({ name: "pay", limit: 20, windowMs: 10 * 60_000 })],
    },
  ],
});
