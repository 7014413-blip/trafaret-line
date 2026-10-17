// Folder of review photos (REVIEW_PHOTOS_DIR, default uploads/reviews). Outside any public
// folder: a photo is served by /tl-media/reviews only after its review is published.

import path from "node:path"

export function reviewPhotosDir(): string {
  return process.env.REVIEW_PHOTOS_DIR?.trim() || path.join(process.cwd(), "uploads", "reviews")
}

/** File name of a review photo: "<review id>-<n>.jpg|png"; null for anything else. */
export function parseReviewPhotoName(file: string): { reviewId: string; ext: "jpg" | "png" } | null {
  const match = /^(rev_[A-Za-z0-9]+)-([1-9])\.(jpg|png)$/.exec(file)
  return match ? { reviewId: match[1], ext: match[3] as "jpg" | "png" } : null
}
