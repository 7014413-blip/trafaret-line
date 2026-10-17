// «Відгуки»: every published review of the shop, newest first, 20 per page (ТЗ §4.10, §15).

import type { Metadata } from "next";
import Link from "@/components/i18n/LocaleLink";
import { InfoPage } from "@/components/layout/InfoPage";
import { ReviewList } from "@/components/reviews/ReviewList";
import { Stars } from "@/components/reviews/Stars";
import { pageMeta } from "@/lib/seo/page-meta";
import { plural } from "@/lib/text/plural";
import { listReviews } from "@/services/medusa-reviews";
import { PAGES } from "@/lib/i18n/dictionaries/pages";
import { CATALOG } from "@/lib/i18n/dictionaries/catalog";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import type { LangParams } from "@/types/i18n";

export const revalidate = 300;

const PAGE = 20;

type Props = { params: Promise<LangParams>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = localeOf((await params).lang);
  const t = tr(PAGES, locale);
  return pageMeta({ title: t.reviewsMetaTitle, description: t.reviewsMetaDescription, path: "/vidguky", locale });
}

export default async function ReviewsPage({ params, searchParams }: Props) {
  const locale = localeOf((await params).lang);
  const t = tr(PAGES, locale);
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const list = await listReviews({ limit: PAGE, offset: (page - 1) * PAGE });
  const pages = Math.max(1, Math.ceil(list.total / PAGE));
  const { count, average } = list.summary;
  return (
    <InfoPage title={t.reviewsTitle} lead={t.reviewsLead} locale={locale}>
      {count > 0 ? (
        <>
          <p className="flex flex-wrap items-center gap-2">
            <Stars value={average} size={20} locale={locale} />
            <b className="tabular-nums">{String(average).replace(".", ",")}</b>
            <span className="text-[var(--muted)]">· {count} {plural(locale, count, tr(CATALOG, locale).reviewForms)}</span>
          </p>
          <ReviewList reviews={list.reviews} showProduct locale={locale} />
          {pages > 1 && (
            <nav aria-label={t.reviewsPages} className="flex items-center gap-3">
              {page > 1 && <Link href={page === 2 ? "/vidguky" : `/vidguky?page=${page - 1}`} className="underline">{t.newer}</Link>}
              <span className="text-[var(--muted)]">{t.pageOf(page, pages)}</span>
              {page < pages && <Link href={`/vidguky?page=${page + 1}`} className="underline">{t.older}</Link>}
            </nav>
          )}
        </>
      ) : (
        <p>{t.reviewsSoon}</p>
      )}
    </InfoPage>
  );
}
