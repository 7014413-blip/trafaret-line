// AggregateRating and Review entries of schema.org for a product with published reviews
// (ТЗ §18: only real reviews). Nothing when the product has no reviews yet.

import type { ReviewListResponse } from "../../types/reviews";

export function reviewJsonLd(list: ReviewListResponse, maxReviews = 5): Record<string, unknown> {
  if (!list.summary.count) return {};
  return {
    aggregateRating: { "@type": "AggregateRating", ratingValue: list.summary.average, reviewCount: list.summary.count, bestRating: 5, worstRating: 1 },
    review: list.reviews.slice(0, maxReviews).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.publishedAt.slice(0, 10),
      reviewBody: r.text,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    })),
  };
}
