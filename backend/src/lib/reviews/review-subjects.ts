// What a customer can review in an order: every catalogue product once (several sizes of one
// product are one review), and the order as a whole when it has made-to-order items
// (constructors, blanks, signs), which have no product page.

import type { ReviewSubject } from "../../shared/types/reviews"
import { REVIEW_LIMITS } from "../../shared/lib/reviews/review-limits"
import type { QueryGraph } from "../../types/order-files"

interface RawItem {
  title: string
  product_title?: string | null
  product_handle?: string | null
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
}

interface RawOrder {
  id: string
  display_id: number
  status?: string
  items?: RawItem[]
}

export interface OrderReviewSubjects {
  orderId: string
  orderNumber: string
  subjects: Omit<ReviewSubject, "reviewed">[]
}

/** Subjects of the order; null when there is no such order or it was cancelled. */
export async function orderReviewSubjects(graph: QueryGraph, orderId: string): Promise<OrderReviewSubjects | null> {
  const { data } = await graph({
    entity: "order",
    fields: ["id", "display_id", "status", "items.title", "items.product_title", "items.product_handle", "items.thumbnail", "items.metadata"],
    filters: { id: orderId },
  })
  const order = data[0] as RawOrder | undefined
  if (!order || order.status === "canceled") return null
  const subjects: Omit<ReviewSubject, "reviewed">[] = []
  const others: RawItem[] = []
  for (const item of order.items ?? []) {
    const handle = item.metadata?.kind === "catalog" ? item.product_handle ?? null : null
    if (!handle) { others.push(item); continue }
    if (subjects.some((s) => s.key === handle)) continue
    subjects.push({ key: handle, productHandle: handle, title: item.product_title || item.title, image: item.thumbnail ?? null })
  }
  if (others.length) {
    const names = others.map((item) => item.title)
    const title = names.length > 2 ? `${names.slice(0, 2).join(", ")} та ще ${names.length - 2}` : names.join(", ")
    subjects.push({ key: REVIEW_LIMITS.orderKey, productHandle: null, title, image: others.find((item) => item.thumbnail)?.thumbnail ?? null })
  }
  return { orderId: order.id, orderNumber: `TL-${order.display_id}`, subjects }
}
