// A published row of tl_review as the storefront shows it.

import type { PublicReview } from "../../shared/types/reviews"
import type { ReviewRecord } from "../../types/reviews"
import { publicReviewPhotoUrl } from "./review-photo-url"

const iso = (value: Date | string | null): string | null => (value == null ? null : new Date(value).toISOString())

export function toPublicReview(row: ReviewRecord): PublicReview {
  return {
    id: row.id,
    productHandle: row.product_handle,
    productTitle: row.product_title,
    name: row.author_name,
    city: row.city,
    rating: Number(row.rating),
    text: row.text,
    photos: (row.photos ?? []).map(publicReviewPhotoUrl),
    shopReply: row.shop_reply,
    publishedAt: iso(row.published_at) ?? iso(row.created_at)!,
    source: row.source,
  }
}
