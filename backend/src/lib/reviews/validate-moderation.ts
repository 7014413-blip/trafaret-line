// Check of the manager's decision in «Відгуки» (POST /admin/tl-reviews/:id).

import { cleanReviewText } from "../../shared/lib/reviews/clean-review-text"
import type { ReviewModeration } from "../../types/reviews"

const STATUSES = new Set(["pending", "approved", "rejected"])

export function validateModeration(raw: unknown): { ok: true; value: ReviewModeration } | { ok: false; message: string } {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const value: ReviewModeration = {}
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUSES.has(body.status)) return { ok: false, message: "Невідомий статус відгуку" }
    value.status = body.status as ReviewModeration["status"]
  }
  if (body.text !== undefined) {
    const text = cleanReviewText(body.text, true)
    if (!text || text.length > 4000) return { ok: false, message: "Текст відгуку від 1 до 4000 символів" }
    value.text = text
  }
  if (body.shopReply !== undefined) {
    const reply = body.shopReply === null ? "" : cleanReviewText(body.shopReply, true)
    if (reply.length > 2000) return { ok: false, message: "Відповідь магазину до 2000 символів" }
    value.shopReply = reply || null
  }
  if (body.removePhotos !== undefined) {
    if (!Array.isArray(body.removePhotos) || !body.removePhotos.every((f) => typeof f === "string")) return { ok: false, message: "Невірний список фото" }
    value.removePhotos = body.removePhotos as string[]
  }
  return { ok: true, value }
}
