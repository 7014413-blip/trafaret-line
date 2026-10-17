"use client";

// «Повторити замовлення»: the lines of a past order go into the cart at today's price (the cart
// applies the quantity scale; the checkout prices everything again on the server).

import type { RepeatCartLine } from "@/types/account";
import type { Locale } from "@/types/customizer";
import { useCart } from "@/store/cart-store";
import { ACCOUNT } from "@/lib/i18n/dictionaries/account";
import { tr } from "@/lib/i18n/translate";

export function RepeatOrderButton({ lines, number, locale = "uk" }: { lines: RepeatCartLine[]; number: string; locale?: Locale }) {
  const t = tr(ACCOUNT, locale);
  const add = useCart((s) => s.add);
  if (!lines.length) return null;
  return (
    <button
      type="button"
      onClick={() => lines.forEach((line) => add(line))}
      className="h-11 rounded-full bg-[var(--buy)] px-5 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)]"
      aria-label={t.repeatOrder(number)}
    >
      {t.repeat}
    </button>
  );
}
