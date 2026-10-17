// Review of a received order by the link the manager sends (ТЗ §4.10): /vidguk/<order id>?t=<token>.
// Not for search engines; a wrong or old link explains what to do.

import type { Metadata } from "next";
import Link from "@/components/i18n/LocaleLink";
import { InfoPage } from "@/components/layout/InfoPage";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { REVIEW_FORM } from "@/lib/i18n/dictionaries/review-form";
import { localeOf } from "@/lib/i18n/locales";
import { tr } from "@/lib/i18n/translate";
import { reviewOrder } from "@/services/medusa-reviews";
import type { LangParams } from "@/types/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<LangParams & { orderId: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const text = tr(REVIEW_FORM, localeOf((await params).lang));
  return { title: text.title, robots: { index: false, follow: false } };
}

export default async function ReviewOrderPage({ params, searchParams }: Props) {
  const { orderId, lang } = await params;
  const locale = localeOf(lang);
  const text = tr(REVIEW_FORM, locale);
  const { t } = await searchParams;
  const order = t ? await reviewOrder(orderId, t) : null;
  return (
    <InfoPage title={text.title} lead={order ? text.lead : undefined} locale={locale}>
      {order ? (
        <ReviewForm orderId={orderId} token={t!} orderNumber={order.orderNumber} subjects={order.subjects} />
      ) : (
        <p>{text.badLinkStart}<Link href="/kontakty" className="underline">{text.contacts}</Link>{text.badLinkEnd}</p>
      )}
    </InfoPage>
  );
}
