// One review in «Відгуки».
// POST   /admin/tl-reviews/:id { status?, text?, shopReply?, removePhotos? } → the review as it is now
// DELETE /admin/tl-reviews/:id → the review and its photos are deleted
// A change of what the site shows asks the storefront to drop its cache.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refreshStorefrontCatalog } from "../../../../lib/kabinet/storefront"
import { deleteReviewPhotos } from "../../../../lib/reviews/delete-review-photos"
import { reviewStore } from "../../../../lib/reviews/review-store"
import { toAdminReview } from "../../../../lib/reviews/to-admin-review"
import { validateModeration } from "../../../../lib/reviews/validate-moderation"

const GONE = { message: "Відгук не знайдено" }

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const check = validateModeration(req.body)
  if (!check.ok) return res.status(400).json({ message: check.message })
  const store = reviewStore(req.scope)
  const before = await store.findReview(req.params.id)
  if (!before) return res.status(404).json(GONE)
  const after = await store.moderateReview(req.params.id, check.value)
  if (!after) return res.status(404).json(GONE)
  await deleteReviewPhotos(before.photos.filter((file) => !after.photos.includes(file)))
  if (before.status === "approved" || after.status === "approved") await refreshStorefrontCatalog()
  res.json({ review: toAdminReview(after) })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const removed = await reviewStore(req.scope).removeReview(req.params.id)
  if (!removed) return res.status(404).json(GONE)
  await deleteReviewPhotos(removed.photos)
  if (removed.status === "approved") await refreshStorefrontCatalog()
  res.json({ id: removed.id, deleted: true })
}
