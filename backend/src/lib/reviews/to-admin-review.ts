// A row of tl_review for the moderation page «Відгуки».

import type { AdminReview, ReviewRecord } from "../../types/reviews"
import { adminReviewPhotoUrl } from "./review-photo-url"

const iso = (value: Date | string | null): string | null => (value == null ? null : new Date(value).toISOString())

export function toAdminReview(row: ReviewRecord): AdminReview {
  return {
    id: row.id,
    status: row.status,
    source: row.source,
    orderId: row.order_id,
    orderNumber: row.order_number,
    productHandle: row.product_handle,
    productTitle: row.product_title,
    name: row.author_name,
    city: row.city,
    rating: Number(row.rating),
    text: row.text,
    photos: (row.photos ?? []).map((file) => ({ file, url: adminReviewPhotoUrl(file) })),
    shopReply: row.shop_reply,
    createdAt: iso(row.created_at)!,
    publishedAt: iso(row.published_at),
  }
}
