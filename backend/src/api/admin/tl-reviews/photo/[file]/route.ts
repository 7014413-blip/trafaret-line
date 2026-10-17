// GET /admin/tl-reviews/photo/<file> → a review photo for moderation, whatever the status.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readReviewPhoto } from "../../../../../lib/reviews/read-review-photo"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const photo = await readReviewPhoto(req.params.file)
  if (!photo) return res.status(404).json({ message: "Not found" })
  res.setHeader("content-type", photo.type)
  res.setHeader("cache-control", "private, max-age=3600")
  res.setHeader("x-content-type-options", "nosniff")
  res.send(photo.data)
}
