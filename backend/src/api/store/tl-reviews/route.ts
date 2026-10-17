// GET /store/tl-reviews?product=<handle>&limit=&offset= → published reviews of a product
// GET /store/tl-reviews?subject=order                    → reviews of orders as a whole
// GET /store/tl-reviews                                  → every published review («Відгуки»)
// With the count and the average stars of the same selection (types/reviews.ts).

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ReviewListResponse } from "../../../shared/types/reviews"
import { reviewStore } from "../../../lib/reviews/review-store"
import { toPublicReview } from "../../../lib/reviews/to-public-review"

const int = (value: unknown, fallback: number, max: number) => {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : fallback
}

export async function GET(req: MedusaRequest, res: MedusaResponse<ReviewListResponse | { message: string }>) {
  const product = typeof req.query.product === "string" ? req.query.product : undefined
  if (product !== undefined && !/^[a-z0-9][a-z0-9-]{0,199}$/.test(product)) return res.status(400).json({ message: "Невірний товар" })
  const subject = product ?? (req.query.subject === "order" ? "order" : undefined)
  const page = await reviewStore(req.scope).listPublished({ subject, limit: int(req.query.limit, 10, 50) || 10, offset: int(req.query.offset, 0, 100_000) })
  res.json({ reviews: page.rows.map(toPublicReview), summary: page.summary, total: page.total })
}
