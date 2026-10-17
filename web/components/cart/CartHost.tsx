"use client";

// Connects the floating CartDrawer to the local cart store. When Medusa is wired in,
// the store actions call the Store API; the drawer stays the same. The drawer is rendered
// into <body>: inside the sticky header it would stay under the constructors' sticky buy
// bars (the header's z-index caps it) and move with the header when it hides on scroll.

import { useLocaleRouter } from "@/components/i18n/use-locale-router";
import { useEffect, useState } from "react";
import { cartLineItem, itemsValue } from "@/lib/analytics/analytics-item";
import { trackEvent } from "@/lib/analytics/track-event";
import { createPortal } from "react-dom";
import { CartDrawer } from "./CartDrawer";
import { cartTotals, toCartLine, useCart } from "@/store/cart-store";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CHECKOUT } from "@/lib/i18n/dictionaries/checkout";
import { INTL_TAG } from "@/lib/i18n/messages";
import { tr } from "@/lib/i18n/translate";
import type { Dictionary } from "@/types/i18n";

type Upsell = { id: string; title: string; reason: string; price: number };

const UPSELLS: Dictionary<Upsell[]> = {
  uk: [
    { id: "valyk", title: "Валик поролоновий 10 см", reason: "Для рівного шару фарби", price: 85 },
    { id: "klei", title: "Клей-спрей для фіксації", reason: "Трафарет не зсувається", price: 220 },
  ],
  ru: [
    { id: "valyk", title: "Валик поролоновый 10 см", reason: "Для ровного слоя краски", price: 85 },
    { id: "klei", title: "Клей-спрей для фиксации", reason: "Трафарет не сдвигается", price: 220 },
  ],
};

export function CartHost() {
  const locale = useLocale();
  const router = useLocaleRouter();
  const { items, open, setOpen, setQty, remove, add } = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []); // the cart lives in localStorage: render after hydration
  // «view_cart» each time the drawer opens, with the lines it shows at that moment.
  useEffect(() => {
    if (!open || !ready) return;
    const viewed = useCart.getState().items.map((line, index) => cartLineItem({ ...line, unitPrice: toCartLine(line).unitPrice }, index));
    trackEvent("view_cart", { value: itemsValue(viewed), items: viewed });
  }, [open, ready]);
  if (!ready) return null;
  const { lines } = cartTotals(items);

  return createPortal(
    <CartDrawer
      lines={lines}
      upsells={tr(UPSELLS, locale)}
      open={open}
      onOpenChange={setOpen}
      onQuantity={setQty}
      onRemove={remove}
      onAddUpsell={(u) => add({ key: `upsell-${u.id}`, title: u.title, materialId: "pet_thin", widthCm: 0, heightCm: 0, quantity: 1, fixedPrice: u.price, kind: "accessory" })}
      onCheckout={() => { setOpen(false); router.push("/checkout"); }}
      dispatchText={formatDispatch(estimateDispatchDate(new Date()), locale)}
      locale={locale}
    />,
    document.body,
  );
}

export function CartButton() {
  const locale = useLocale();
  const { items, setOpen } = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const { count, total } = ready ? cartTotals(items) : { count: 0, total: 0 };
  return (
    <button type="button" onClick={() => setOpen(true)} aria-label={tr(CHECKOUT, locale).cartLabel(count)}
      className="flex h-11 items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 font-bold sm:gap-2 sm:px-3.5">
      🛒 <span className="hidden tabular-nums sm:inline">{total.toLocaleString(INTL_TAG[locale])} ₴</span>
      <em className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--buy)] px-1 text-xs not-italic text-[var(--buy-fg)]">{count}</em>
    </button>
  );
}
