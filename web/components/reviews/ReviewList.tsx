// Published reviews: stars, name and city, date, text, photos of the buyer and the shop's
// answer. On the «Відгуки» page each review also links to its product.

import Image from "next/image";
import Link from "@/components/i18n/LocaleLink";
import type { PublicReview } from "@/types/reviews";
import { formatReviewDate } from "@/lib/reviews/format-review-date";
import type { Locale } from "@/types/customizer";
import { CATALOG } from "@/lib/i18n/dictionaries/catalog";
import { tr } from "@/lib/i18n/translate";
import { Stars } from "./Stars";

export function ReviewList({ reviews, showProduct = false, locale = "uk" }: { reviews: PublicReview[]; showProduct?: boolean; locale?: Locale }) {
  const t = tr(CATALOG, locale);
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {reviews.map((r) => (
        <li key={r.id} className="grid gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4" data-testid="review">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars value={r.rating} locale={locale} />
            <b>{r.name}</b>
            {r.city && <span className="text-[var(--muted)]">{r.city}</span>}
            <time dateTime={r.publishedAt} className="ml-auto text-sm text-[var(--muted)]">{formatReviewDate(r.publishedAt, locale)}</time>
          </div>
          {showProduct && r.productHandle && (
            <Link href={`/p/${r.productHandle}`} className="text-sm font-medium underline underline-offset-2">{r.productTitle ?? t.product}</Link>
          )}
          <p className="m-0 whitespace-pre-line">{r.text}</p>
          {r.photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {r.photos.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noopener" className="relative block h-24 w-24 overflow-hidden rounded-xl bg-[var(--surface)]">
                  <Image src={url} alt={t.buyerPhoto(i + 1)} fill sizes="96px" className="object-cover" />
                </a>
              ))}
            </div>
          )}
          {r.shopReply && (
            <div className="rounded-xl bg-[var(--surface)] p-3 text-sm">
              <b>{t.shopReply}</b> <span className="whitespace-pre-line">{r.shopReply}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
