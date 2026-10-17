// «Відгуки»: every published review of the shop, newest first, 20 per page (ТЗ §4.10, §15).

import type { Metadata } from "next";
import Link from "@/components/i18n/LocaleLink";
import { InfoPage } from "@/components/layout/InfoPage";
import { ReviewList } from "@/components/reviews/ReviewList";
import { Stars } from "@/components/reviews/Stars";
import { pageMeta } from "@/lib/seo/page-meta";
import { pluralUk } from "@/lib/text/plural-uk";
import { listReviews } from "@/services/medusa-reviews";

export const revalidate = 300;

const PAGE = 20;

export const metadata: Metadata = pageMeta({
  title: "Відгуки покупців",
  description: "Відгуки покупців Trafaret Line з фото: трафарети, заготовки з акрилу і ПЕТ, вивіски та написи.",
  path: "/vidguky",
});

type Props = { searchParams: Promise<{ page?: string }> };

export default async function ReviewsPage({ searchParams }: Props) {
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const list = await listReviews({ limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.max(1, Math.ceil(list.total / PAGE));
  const { count, average } = list.summary;
  return (
    <InfoPage title="Відгуки покупців" lead="Відгуки публікуємо після перевірки: лише від покупців, які отримали замовлення.">
      {count > 0 ? (
        <>
          <p className="flex flex-wrap items-center gap-2">
            <Stars value={average} size={20} />
            <b className="tabular-nums">{String(average).replace(".", ",")}</b>
            <span className="text-[var(--muted)]">· {count} {pluralUk(count, ["відгук", "відгуки", "відгуків"])}</span>
          </p>
          <ReviewList reviews={list.reviews} showProduct />
          {pages > 1 && (
            <nav aria-label="Сторінки відгуків" className="flex items-center gap-3">
              {page > 1 && <Link href={page === 2 ? "/vidguky" : `/vidguky?page=${page - 1}`} className="underline">Новіші</Link>}
              <span className="text-[var(--muted)]">Сторінка {page} з {pages}</span>
              {page < pages && <Link href={`/vidguky?page=${page + 1}`} className="underline">Старіші</Link>}
            </nav>
          )}
        </>
      ) : (
        <p>Відгуки скоро зʼявляться. Після отримання замовлення ми надсилаємо посилання, щоб ви могли поділитися враженнями і фото.</p>
      )}
    </InfoPage>
  );
}
