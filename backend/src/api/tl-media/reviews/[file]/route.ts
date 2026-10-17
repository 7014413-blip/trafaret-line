// GET /tl-media/reviews/<review id>-<n>.jpg → a photo of a published review. Outside /store,
// so a plain <img> can load it without the publishable key; photos of reviews waiting for
// moderation or rejected answer 404.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { parseReviewPhotoName } from "../../../../lib/reviews/review-photos-dir"
import { readReviewPhoto } from "../../../../lib/reviews/read-review-photo"
import { reviewStore } from "../../../../lib/reviews/review-store"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const file = req.params.file
  const name = parseReviewPhotoName(file)
  const review = name ? await reviewStore(req.scope).findReview(name.reviewId) : null
  if (!review || review.status !== "approved" || !review.photos.includes(file)) return res.status(404).json({ message: "Not found" })
  const photo = await readReviewPhoto(file)
  if (!photo) return res.status(404).json({ message: "Not found" })
  res.setHeader("content-type", photo.type)
  res.setHeader("cache-control", "public, max-age=86400")
  res.setHeader("x-content-type-options", "nosniff")
  res.send(photo.data)
}
