// Customer reviews on the Medusa side (ТЗ §4.10): the tl_review table, moderation in
// «Простий кабінет» (src/admin/routes/vidguky) and the shapes of its admin API. What the
// storefront sees is in shared/types/reviews.ts.

import type { ReviewSource, ReviewStatus, ReviewSummary } from "../shared/types/reviews"

/** A row of tl_review. */
export interface ReviewRecord {
  id: string
  order_id: string | null
  order_number: string | null
  /** Product handle, or "order" for the order as a whole. */
  subject_key: string
  product_handle: string | null
  product_title: string | null
  author_name: string
  city: string | null
  rating: number
  text: string
  /** File names in the review photos folder (lib/reviews/review-photos-dir.ts). */
  photos: string[]
  status: ReviewStatus
  source: ReviewSource
  /** Id of the review on the old site, for moved reviews (no doubles on a second run). */
  external_id: string | null
  shop_reply: string | null
  published_at: Date | string | null
  created_at: Date | string
}

/** A review sent by the link of an order. */
export interface NewSiteReview {
  orderId: string
  orderNumber: string
  subjectKey: string
  productHandle: string | null
  productTitle: string | null
  name: string
  city: string | null
  rating: number
  text: string
}

/** A review moved from topperok.com.ua or eventdecor.com.ua, published as it was there. */
export interface MovedReview {
  source: Exclude<ReviewSource, "site">
  externalId: string
  productHandle: string | null
  productTitle: string | null
  name: string
  city: string | null
  rating: number
  text: string
  publishedAt: string
}

/** Decision of the manager in «Відгуки». */
export interface ReviewModeration {
  status?: ReviewStatus
  /** Corrected text (typos, a phone number taken out). */
  text?: string
  shopReply?: string | null
  /** Photos the manager removed (file names). */
  removePhotos?: string[]
}

/** A review in the moderation list. */
export interface AdminReview {
  id: string
  status: ReviewStatus
  source: ReviewSource
  orderId: string | null
  orderNumber: string | null
  productHandle: string | null
  productTitle: string | null
  name: string
  city: string | null
  rating: number
  text: string
  /** Addresses of the photos for the admin (any status). */
  photos: { file: string; url: string }[]
  shopReply: string | null
  createdAt: string
  publishedAt: string | null
}

/** GET /admin/tl-reviews */
export interface AdminReviewListResponse {
  reviews: AdminReview[]
  total: number
  counts: Record<ReviewStatus, number>
}

/** Options of a published list. */
export interface PublishedQuery {
  /** Product handle; "order" = reviews of orders as a whole; undefined = every review. */
  subject?: string
  limit: number
  offset: number
}

export interface PublishedPage {
  rows: ReviewRecord[]
  total: number
  summary: ReviewSummary
}
