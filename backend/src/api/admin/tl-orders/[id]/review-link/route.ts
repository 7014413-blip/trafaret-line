// GET /admin/tl-orders/:id/review-link → { url } for the order page button «Посилання на відгук»:
// the manager sends it to the customer after the parcel is received (ТЗ §4.10).

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requestGraph } from "../../../../../lib/orders/admin-graph"
import { orderNumberOf } from "../../../../../lib/orders/order-number"
import { reviewLink } from "../../../../../lib/reviews/review-link"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderNumber = await orderNumberOf(requestGraph(req), req.params.id)
  if (!orderNumber) return res.status(404).json({ message: "Замовлення не знайдено" })
  const url = reviewLink(req.params.id)
  if (!url) return res.status(503).json({ message: "На сервері не задано INTERNAL_API_TOKEN, посилання не створити" })
  res.json({ orderNumber, url })
}
