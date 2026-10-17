// «Відгуки» on a product page: the average, the latest reviews and a link to all of them.
// Before the first review the block invites the buyer to leave one after the purchase.

import Link from "next/link";
import type { ReviewListResponse } from "@/types/reviews";
import { pluralUk } from "@/lib/text/plural-uk";
import { ReviewList } from "./ReviewList";
import { Stars } from "./Stars";

export function ProductReviews({ list }: { list: ReviewListResponse }) {
  const { count, average } = list.summary;
  return (
    <section id="vidguky" className="mt-10 max-w-[860px]" aria-labelledby="reviews-title">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 id="reviews-title" className="m-0 text-xl font-bold">Відгуки</h2>
        {count > 0 && (
          <span className="flex items-center gap-2" data-testid="review-summary">
            <Stars value={average} />
            <b className="tabular-nums">{String(average).replace(".", ",")}</b>
            <span className="text-[var(--muted)]">· {count} {pluralUk(count, ["відгук", "відгуки", "відгуків"])}</span>
          </span>
        )}
      </div>
      {count > 0 ? (
        <>
          <ReviewList reviews={list.reviews} />
          <Link href="/vidguky" className="mt-3 inline-block font-medium underline underline-offset-2">Усі відгуки покупців</Link>
        </>
      ) : (
        <p className="m-0 text-[var(--muted)]">Відгуків про цей товар ще немає. Після отримання замовлення ми надішлемо посилання, щоб ви могли поділитися враженнями і фото.</p>
      )}
    </section>
  );
}
