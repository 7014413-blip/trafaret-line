// «Відгуки»: reviews of customers wait here until the manager publishes them (ТЗ §4.10).
// Tabs «Нові», «Опубліковані», «Приховані» with counts; 30 per page.

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import type { ReviewStatus } from "../../../shared/types/reviews"
import type { AdminReview, AdminReviewListResponse } from "../../../types/reviews"
import { ReviewCard } from "../../components/review-card"
import { listReviews } from "../../lib/reviews-api"

const TABS: { status: ReviewStatus; label: string }[] = [
  { status: "pending", label: "Нові" },
  { status: "approved", label: "Опубліковані" },
  { status: "rejected", label: "Приховані" },
]
const PAGE = 30

const ReviewsPage = () => {
  const [status, setStatus] = useState<ReviewStatus>("pending")
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<AdminReviewListResponse | null>(null)
  const [error, setError] = useState("")
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let live = true
    setError("")
    listReviews(status, offset)
      .then((r) => { if (live) setData(r) })
      .catch((e: Error) => { if (live) setError(e.message) })
    return () => { live = false }
  }, [status, offset, reload])

  // A review that left this tab (published, hidden, deleted) disappears from the list at once.
  const changed = (review: AdminReview) => {
    if (review.status !== status) setReload((n) => n + 1)
    else setData((d) => d && { ...d, reviews: d.reviews.map((r) => (r.id === review.id ? review : r)) })
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="flex flex-wrap items-center justify-between gap-3 p-4">
        <Heading level="h1">Відгуки</Heading>
        <div className="flex gap-2" role="tablist">
          {TABS.map((tab) => (
            <Button key={tab.status} role="tab" aria-selected={tab.status === status} size="small" variant={tab.status === status ? "primary" : "secondary"}
              onClick={() => { setStatus(tab.status); setOffset(0) }}>
              {tab.label} ({data?.counts[tab.status] ?? 0})
            </Button>
          ))}
        </div>
      </Container>
      {error && <Text className="text-ui-fg-error">{error}</Text>}
      {data && !data.reviews.length && <Text className="text-ui-fg-subtle">Тут поки порожньо.</Text>}
      {data?.reviews.map((review) => (
        <ReviewCard key={review.id} review={review} onChange={changed} onDelete={() => setReload((n) => n + 1)} />
      ))}
      {data && data.total > PAGE && (
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Назад</Button>
          <Text size="small">{offset + 1}–{Math.min(offset + PAGE, data.total)} з {data.total}</Text>
          <Button size="small" variant="secondary" disabled={offset + PAGE >= data.total} onClick={() => setOffset(offset + PAGE)}>Далі</Button>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Відгуки",
})

export default ReviewsPage
