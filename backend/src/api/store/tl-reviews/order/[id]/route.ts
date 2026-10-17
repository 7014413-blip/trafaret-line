// The review form of a received order (ТЗ §4.10), only by the link with its token
// (lib/reviews/review-link.ts); a wrong token answers 404 like a missing order.
// GET  /store/tl-reviews/order/:id?t= → { orderNumber, subjects } (types/reviews.ts)
// POST /store/tl-reviews/order/:id?t= { key, name, city, rating, text, photos[] } → the review
//      waits for moderation. One review per product (and per «order as a whole») per order.
// Requests per address are limited in api/middlewares.ts.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ReviewOrderResponse, ReviewSubmitResponse } from "../../../../../shared/types/reviews"
import { validateReviewInput } from "../../../../../shared/lib/reviews/validate-review"
import { requestGraph } from "../../../../../lib/orders/admin-graph"
import { reviewTokenValid } from "../../../../../lib/reviews/review-link"
import { reviewStore } from "../../../../../lib/reviews/review-store"
import { orderReviewSubjects } from "../../../../../lib/reviews/review-subjects"
import { saveReviewPhotos } from "../../../../../lib/reviews/save-review-photos"

const NOT_FOUND = { message: "Посилання недійсне. Напишіть нам, і ми надішлемо нове." }

export async function GET(req: MedusaRequest, res: MedusaResponse<ReviewOrderResponse | { message: string }>) {
  const orderId = req.params.id
  if (!reviewTokenValid(orderId, req.query.t)) return res.status(404).json(NOT_FOUND)
  const order = await orderReviewSubjects(requestGraph(req), orderId)
  if (!order) return res.status(404).json(NOT_FOUND)
  const reviewed = new Set(await reviewStore(req.scope).reviewedSubjects(orderId))
  res.json({ orderNumber: order.orderNumber, subjects: order.subjects.map((s) => ({ ...s, reviewed: reviewed.has(s.key) })) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse<ReviewSubmitResponse | { message: string; errors?: Record<string, string> }>) {
  const orderId = req.params.id
  if (!reviewTokenValid(orderId, req.query.t)) return res.status(404).json(NOT_FOUND)
  const order = await orderReviewSubjects(requestGraph(req), orderId)
  if (!order) return res.status(404).json(NOT_FOUND)
  const check = validateReviewInput(req.body)
  if (!check.ok) return res.status(400).json({ message: "Перевірте відгук", errors: check.errors })
  const input = check.value
  const subject = order.subjects.find((s) => s.key === input.key)
  if (!subject) return res.status(400).json({ message: "Цього товару немає в замовленні", errors: { key: "Оберіть товар із замовлення" } })

  const store = reviewStore(req.scope)
  const id = await store.addSiteReview({
    orderId, orderNumber: order.orderNumber, subjectKey: subject.key, productHandle: subject.productHandle, productTitle: subject.title,
    name: input.name, city: input.city || null, rating: input.rating, text: input.text,
  })
  if (!id) return res.status(409).json({ message: "Відгук на цей товар уже надіслано. Дякуємо!" })
  const photos = await saveReviewPhotos(id, input.photos.map((p) => Buffer.from(p, "base64")))
  if (photos.length) await store.setReviewPhotos(id, photos)
  res.json({ ok: true, status: "pending" })
}
