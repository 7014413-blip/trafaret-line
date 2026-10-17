// Reviews from Medusa for server components (ТЗ §4.10): published reviews of a product or of
// the whole shop (cached with the catalogue, so publishing in «Простий кабінет» refreshes them)
// and the review form of an order by its link (never cached). A review list that cannot be
// read shows as empty: a product page never fails because of its reviews.

import "server-only";
import type { ReviewListResponse, ReviewOrderResponse } from "../types/reviews";
import { storeGet } from "./medusa-store";

const EMPTY: ReviewListResponse = { reviews: [], summary: { count: 0, average: 0 }, total: 0 };

/** Published reviews: of one product, or (product omitted) every review, newest first. */
export async function listReviews(options: { product?: string; limit: number; offset?: number }): Promise<ReviewListResponse> {
  try {
    return await storeGet<ReviewListResponse>("/store/tl-reviews", { product: options.product, limit: options.limit, offset: options.offset ?? 0 });
  } catch {
    return EMPTY;
  }
}

/** What the order link lets the customer review; null for a wrong link or a missing order. */
export async function reviewOrder(orderId: string, token: string): Promise<ReviewOrderResponse | null> {
  try {
    return await storeGet<ReviewOrderResponse>(`/store/tl-reviews/order/${encodeURIComponent(orderId)}`, { t: token }, "no-store");
  } catch {
    return null;
  }
}
