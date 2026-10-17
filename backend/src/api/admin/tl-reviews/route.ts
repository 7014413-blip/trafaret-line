// «Відгуки» in «Простий кабінет»: reviews of one status, newest first, 30 per page.
// GET /admin/tl-reviews?status=pending|approved|rejected&offset= → AdminReviewListResponse
// Admin only: Medusa protects /admin/*.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ReviewStatus } from "../../../shared/types/reviews"
import type { AdminReviewListResponse } from "../../../types/reviews"
import { reviewStore } from "../../../lib/reviews/review-store"
import { toAdminReview } from "../../../lib/reviews/to-admin-review"

const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"]
const PAGE = 30

export async function GET(req: MedusaRequest, res: MedusaResponse<AdminReviewListResponse>) {
  const status = STATUSES.find((s) => s === req.query.status) ?? "pending"
  const offset = Math.max(0, Number.parseInt(String(req.query.offset ?? "0"), 10) || 0)
  const page = await reviewStore(req.scope).listForModeration(status, PAGE, offset)
  res.json({ reviews: page.rows.map(toAdminReview), total: page.total, counts: page.counts })
}
