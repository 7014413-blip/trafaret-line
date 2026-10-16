// Calls of the «Відгуки» page and the order page button to the admin API (api/admin/tl-reviews,
// api/admin/tl-orders/:id/review-link).

import type { ReviewStatus } from "../../shared/types/reviews"
import type { AdminReview, AdminReviewListResponse, ReviewModeration } from "../../types/reviews"
import { adminJson } from "./admin-json"

export function listReviews(status: ReviewStatus, offset: number): Promise<AdminReviewListResponse> {
  return adminJson(`/admin/tl-reviews?status=${status}&offset=${offset}`)
}

export async function moderateReview(id: string, change: ReviewModeration): Promise<AdminReview> {
  const { review } = await adminJson<{ review: AdminReview }>(`/admin/tl-reviews/${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify(change) })
  return review
}

export async function deleteReview(id: string): Promise<void> {
  await adminJson(`/admin/tl-reviews/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export function orderReviewLink(orderId: string): Promise<{ orderNumber: string; url: string }> {
  return adminJson(`/admin/tl-orders/${encodeURIComponent(orderId)}/review-link`)
}
