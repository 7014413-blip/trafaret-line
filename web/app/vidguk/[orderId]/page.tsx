// Review of a received order by the link the manager sends (ТЗ §4.10): /vidguk/<order id>?t=<token>.
// Not for search engines; a wrong or old link explains what to do.

import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/layout/InfoPage";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { reviewOrder } from "@/services/medusa-reviews";

export const metadata: Metadata = { title: "Відгук про замовлення", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderId: string }>; searchParams: Promise<{ t?: string }> };

export default async function ReviewOrderPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { t } = await searchParams;
  const order = t ? await reviewOrder(orderId, t) : null;
  return (
    <InfoPage title="Відгук про замовлення" lead={order ? "Розкажіть, як вам наша робота. Найкраще — з фото результату: воно допоможе іншим покупцям обрати." : undefined}>
      {order ? (
        <ReviewForm orderId={orderId} token={t!} orderNumber={order.orderNumber} subjects={order.subjects} />
      ) : (
        <p>Посилання недійсне або застаріло. Напишіть нам на сторінці <Link href="/kontakty" className="underline">Контакти</Link>, і ми надішлемо нове.</p>
      )}
    </InfoPage>
  );
}
