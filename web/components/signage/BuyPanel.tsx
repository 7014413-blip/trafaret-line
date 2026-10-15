"use client";

// Price of a constructor design and the «В кошик» button: the breakdown, the total, the price of
// one piece when there are several, the shipping date, and the same total and button pinned to
// the bottom of the screen on phones.

import { formatUAH } from "@/lib/format";
import type { BuyState, PriceBreakdownLine } from "@/types/constructor-ui";

const LABELS: Record<BuyState, { full: string; short: string }> = {
  idle: { full: "В кошик", short: "В кошик" },
  error: { full: "В кошик", short: "В кошик" },
  uploading: { full: "Завантажуємо логотип…", short: "Завантажуємо…" },
  added: { full: "✓ Додано в кошик", short: "✓ Додано" },
};

export function BuyPanel({ lines, total, unitPrice, qty, unitLabel = "шт.", note, state, message, canBuy, onBuy, children }: {
  lines: PriceBreakdownLine[];
  /** null while the design has no price (an error blocks it). */
  total: number | null;
  unitPrice: number | null;
  qty: number;
  /** Unit after «× qty»: "шт.", "наб." or "" for none. */
  unitLabel?: string;
  /** Shipping date, or what the manager confirms. */
  note: string;
  state: BuyState;
  message?: string;
  canBuy: boolean;
  onBuy: () => void;
  /** Extra content above the breakdown (a table of piece prices). */
  children?: React.ReactNode;
}) {
  const disabled = !canBuy || state === "uploading";
  const totalText = total == null ? "—" : formatUAH(total);
  const each = unitPrice != null && qty > 1 ? `${formatUAH(unitPrice)} × ${qty}${unitLabel ? ` ${unitLabel}` : ""} · ` : "";
  return (
    <>
      <div className="grid gap-2 rounded-2xl bg-[var(--surface)] p-4">
        {children}
        <ul className="m-0 grid list-none gap-0.5 p-0 text-[13px] text-[var(--muted)]">
          {lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-3"><span>{l.label}</span>{l.amount != null && l.amount > 0 && <span className="tabular-nums">+{formatUAH(l.amount)}</span>}</li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[30px] font-extrabold leading-none tabular-nums">{totalText}
            <small className="mt-1 block text-[13px] font-normal text-[var(--muted)]">{each}{note}</small>
          </div>
          <button type="button" onClick={onBuy} disabled={disabled} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-40">{LABELS[state].full}</button>
        </div>
        {message && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{message}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <b className="text-xl tabular-nums">{totalText}</b>
        <button type="button" onClick={onBuy} disabled={disabled} className="h-12 rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] disabled:opacity-40">{LABELS[state].short}</button>
      </div>
    </>
  );
}
