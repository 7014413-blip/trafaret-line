"use client";

// «Повторити замовлення»: the lines of a past order go into the cart at today's price (the cart
// applies the quantity scale; the checkout prices everything again on the server).

import type { RepeatCartLine } from "@/types/account";
import { useCart } from "@/store/cart-store";

export function RepeatOrderButton({ lines, number }: { lines: RepeatCartLine[]; number: string }) {
  const add = useCart((s) => s.add);
  if (!lines.length) return null;
  return (
    <button
      type="button"
      onClick={() => lines.forEach((line) => add(line))}
      className="h-11 rounded-full bg-[var(--buy)] px-5 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)]"
      aria-label={`Повторити замовлення ${number}`}
    >
      Повторити замовлення
    </button>
  );
}
