// Customer reviews (ТЗ §4.10): stars, text and photos sent by the link of a received order,
// shown on the site only after moderation in «Простий кабінет». Reviews moved from the
// owner's other shops keep their source. Shared by the storefront and Medusa.

export type ReviewSource = "site" | "topperok" | "eventdecor";
export type ReviewStatus = "pending" | "approved" | "rejected";

/** A published review as the site shows it. */
export interface PublicReview {
  id: string;
  /** Catalogue product the review is about; null = about the order or the shop as a whole. */
  productHandle: string | null;
  productTitle: string | null;
  name: string;
  city: string | null;
  /** Whole stars, 1–5. */
  rating: number;
  text: string;
  /** Photo addresses, already moderated. */
  photos: string[];
  /** Answer of the shop, if any. */
  shopReply: string | null;
  /** ISO date of publication (for moved reviews: the date on the old site). */
  publishedAt: string;
  source: ReviewSource;
}

export interface ReviewSummary {
  count: number;
  /** Average stars rounded to one decimal; 0 when there are no reviews. */
  average: number;
}

/** GET /store/tl-reviews */
export interface ReviewListResponse {
  reviews: PublicReview[];
  summary: ReviewSummary;
  /** Number of reviews matching the request (for pages). */
  total: number;
}

/** What the customer can review in one order: each catalogue product, and the order as a whole. */
export interface ReviewSubject {
  /** Product handle, or "order" for the order as a whole (constructor items, the service). */
  key: string;
  productHandle: string | null;
  title: string;
  image: string | null;
  /** A review for it was already sent by this link. */
  reviewed: boolean;
}

/** GET /store/tl-reviews/order/:id?t= */
export interface ReviewOrderResponse {
  orderNumber: string;
  subjects: ReviewSubject[];
}

/** POST /store/tl-reviews/order/:id?t= : one review of one subject. */
export interface ReviewInput {
  key: string;
  name: string;
  city: string;
  rating: number;
  text: string;
  /** JPEG photos as base64, already reduced in the browser (lib/client/resize-photo.ts). */
  photos: string[];
}

export type ReviewInputField = "key" | "name" | "city" | "rating" | "text" | "photos";

export type ReviewInputCheck =
  | { ok: true; value: ReviewInput }
  | { ok: false; errors: Partial<Record<ReviewInputField, string>> };

/** Answer of POST /store/tl-reviews/order/:id. */
export interface ReviewSubmitResponse {
  ok: true;
  /** The review waits for moderation before it shows on the site. */
  status: "pending";
}
