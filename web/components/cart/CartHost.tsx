"use client";

// Connects the floating CartDrawer to the local cart store. When Medusa is wired in,
// the store actions call the Store API; the drawer stays the same.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartDrawer } from "./CartDrawer";
import { cartTotals, useCart } from "@/store/cart-store";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";

const UPSELLS = [
  { id: "valyk", title: "Валик поролоновий 10 см", reason: "Для рівного шару фарби", price: 85 },
  { id: "klei", title: "Клей-спрей для фіксації", reason: "Трафарет не зсувається", price: 220 },
];

export function CartHost() {
  const router = useRouter();
  const { items, open, setOpen, setQty, remove, add } = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []); // the cart lives in localStorage: render after hydration
  if (!ready) return null;
  const { lines } = cartTotals(items);

  return (
    <CartDrawer
      lines={lines}
      upsells={UPSELLS}
      open={open}
      onOpenChange={setOpen}
      onQuantity={setQty}
      onRemove={remove}
      onAddUpsell={(u) => add({ key: `upsell-${u.id}`, title: u.title, materialId: "pet_thin", widthCm: 0, heightCm: 0, quantity: 1, fixedPrice: u.price, kind: "accessory" })}
      onCheckout={() => { setOpen(false); router.push("/checkout"); }}
      dispatchText={formatDispatch(estimateDispatchDate(new Date()))}
    />
  );
}

export function CartButton() {
  const { items, setOpen } = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const { count, total } = ready ? cartTotals(items) : { count: 0, total: 0 };
  return (
    <button type="button" onClick={() => setOpen(true)} aria-label={`Кошик, товарів: ${count}`}
      className="flex h-11 items-center gap-2 rounded-full bg-[var(--surface)] px-3.5 font-bold">
      🛒 <span className="hidden tabular-nums sm:inline">{total.toLocaleString("uk-UA")} ₴</span>
      <em className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--buy)] px-1 text-xs not-italic text-[var(--buy-fg)]">{count}</em>
    </button>
  );
}
