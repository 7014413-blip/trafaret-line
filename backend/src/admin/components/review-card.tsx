// One review on the «Відгуки» page: stars, author, product, order, photos; the text and the
// shop's answer can be corrected; buttons publish, hide or delete it.

import { Badge, Button, Container, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"
import type { AdminReview } from "../../types/reviews"
import { deleteReview, moderateReview } from "../lib/reviews-api"

const SOURCE_LABEL: Record<AdminReview["source"], string> = { site: "Сайт", topperok: "topperok.com.ua", eventdecor: "eventdecor.com.ua" }

const date = (iso: string) => new Date(iso).toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short" })

export const ReviewCard = ({ review, onChange, onDelete }: {
  review: AdminReview
  onChange: (review: AdminReview) => void
  onDelete: (id: string) => void
}) => {
  const [text, setText] = useState(review.text)
  const [reply, setReply] = useState(review.shopReply ?? "")
  const [busy, setBusy] = useState(false)

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    try { await work() } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  const save = (status?: AdminReview["status"]) => run(async () => {
    const updated = await moderateReview(review.id, { status, text, shopReply: reply.trim() ? reply : null })
    onChange(updated)
    toast.success(status === "approved" ? "Опубліковано, на сайті зʼявиться протягом хвилини" : status === "rejected" ? "Відгук приховано" : "Збережено")
  })

  const removePhoto = (file: string) => run(async () => {
    onChange(await moderateReview(review.id, { removePhotos: [file] }))
  })

  const remove = () => run(async () => {
    if (!window.confirm("Видалити відгук разом із фото?")) return
    await deleteReview(review.id)
    onDelete(review.id)
    toast.success("Відгук видалено")
  })

  return (
    <Container className="flex flex-col gap-3 p-4" data-review={review.id}>
      <div className="flex flex-wrap items-center gap-2">
        <Text weight="plus" aria-label={`Оцінка ${review.rating} з 5`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</Text>
        <Text weight="plus">{review.name}</Text>
        {review.city && <Text className="text-ui-fg-subtle">{review.city}</Text>}
        <Badge size="2xsmall">{SOURCE_LABEL[review.source]}</Badge>
        {review.orderNumber && <Badge size="2xsmall" color="blue">{review.orderNumber}</Badge>}
        <Text size="small" className="ml-auto text-ui-fg-subtle">{date(review.createdAt)}</Text>
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        {review.productHandle ? `Товар: ${review.productTitle ?? review.productHandle}` : `Замовлення в цілому: ${review.productTitle ?? ""}`}
      </Text>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`r-text-${review.id}`}>Текст (можна виправити помилки або прибрати телефон)</Label>
        <Textarea id={`r-text-${review.id}`} rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {review.photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.photos.map((photo) => (
            <div key={photo.file} className="flex flex-col items-center gap-1">
              <a href={photo.url} target="_blank" rel="noreferrer">
                <img src={photo.url} alt="Фото покупця" className="h-24 w-24 rounded-md object-cover" />
              </a>
              <Button size="small" variant="transparent" disabled={busy} onClick={() => removePhoto(photo.file)}>Прибрати фото</Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label htmlFor={`r-reply-${review.id}`}>Відповідь магазину (необовʼязково)</Label>
        <Textarea id={`r-reply-${review.id}`} rows={2} value={reply} onChange={(e) => setReply(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {review.status !== "approved" && <Button size="small" isLoading={busy} onClick={() => save("approved")}>Опублікувати</Button>}
        {review.status === "approved" && <Button size="small" variant="secondary" isLoading={busy} onClick={() => save()}>Зберегти</Button>}
        {review.status !== "rejected" && <Button size="small" variant="secondary" isLoading={busy} onClick={() => save("rejected")}>Приховати</Button>}
        <Button size="small" variant="danger" isLoading={busy} onClick={remove}>Видалити</Button>
      </div>
    </Container>
  )
}
