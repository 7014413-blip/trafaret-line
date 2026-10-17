// One order in «Мої замовлення»: number, date, status, parcel number with the carrier's
// tracking link, the lines with today's price and «Повторити замовлення».

import Image from "next/image";
import type { AccountOrder, AccountOrderStage } from "@/types/account";
import { formatUAH } from "@/lib/format";
import { RepeatOrderButton } from "./RepeatOrderButton";
import { ACCOUNT } from "@/lib/i18n/dictionaries/account";
import { tr } from "@/lib/i18n/translate";
import type { Locale } from "@/types/customizer";
import { INTL_TAG } from "@/lib/i18n/messages";

const STAGE_CLASS: Record<AccountOrderStage, string> = {
  accepted: "bg-[var(--surface)]",
  awaiting_payment: "bg-[var(--surface)] ring-1 ring-[var(--ink)]",
  paid: "bg-[var(--surface)]",
  shipped: "bg-[var(--ink)] text-[var(--bg)]",
  cancelled: "bg-[var(--surface)] text-[var(--muted)] line-through",
};

const dateText = (iso: string, locale: Locale) => new Date(iso).toLocaleDateString(INTL_TAG[locale], { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Kyiv" });

export function OrderCard({ order, locale = "uk" }: { order: AccountOrder; locale?: Locale }) {
  const t = tr(ACCOUNT, locale);
  const server = (text: string) => t.serverTexts[text] ?? text;
  const repeatable = order.items.flatMap((item) => (item.repeat ? [item.repeat] : []));
  return (
    <article aria-label={t.order(order.number)} className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="m-0 text-lg font-bold">{t.order(order.number)}</h2>
          <p className="m-0 text-sm text-[var(--muted)]">{dateText(order.createdAt, locale)} · {formatUAH(order.total)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STAGE_CLASS[order.stage]}`}>{server(order.statusText)}</span>
      </header>
      {order.ttn && (
        <p className="m-0">
          ТТН <b className="tabular-nums">{order.ttn}</b>
          {order.trackingUrl && <> · <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{t.whereParcel}</a></>}
        </p>
      )}
      <ul className="m-0 grid list-none gap-3 p-0">
        {order.items.map((item, index) => (
          <li key={index} className="grid grid-cols-[56px_1fr] items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-[var(--surface)]">
              {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="56px" className="object-contain" unoptimized={item.thumbnail.startsWith("data:")} />}
            </div>
            <div className="min-w-0">
              <p className="m-0 font-medium">{item.title}</p>
              <p className="m-0 text-sm text-[var(--muted)]">
                {item.quantity} {t.pieces} × {formatUAH(item.unitPrice)}
                {item.priceNow != null && item.priceNow !== item.unitPrice && <> · {t.now} {formatUAH(item.priceNow)}</>}
              </p>
              {item.repeatProblem && <p className="m-0 text-sm">{server(item.repeatProblem)}</p>}
            </div>
          </li>
        ))}
      </ul>
      <RepeatOrderButton lines={repeatable} number={order.number} locale={locale} />
    </article>
  );
}
