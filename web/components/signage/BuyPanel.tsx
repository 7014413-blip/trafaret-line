"use client";

// Price of a constructor design and the «В кошик» button: the breakdown, the total, the price of
// one piece when there are several, the shipping date, and the same total and button pinned to
// the bottom of the screen on phones.

import { formatUAH } from "@/lib/format";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CONSTRUCTOR } from "@/lib/i18n/dictionaries/constructor";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { tr } from "@/lib/i18n/translate";
import type { BuyState, PriceBreakdownLine } from "@/types/constructor-ui";

export function BuyPanel({ lines, total, unitPrice, qty, unitLabel, note, state, message, canBuy, onBuy, children }: {
  lines: PriceBreakdownLine[];
  /** null while the design has no price (an error blocks it). */
  total: number | null;
  unitPrice: number | null;
  qty: number;
  /** Unit after «× qty»: pieces by default, "наб." or "" for none. */
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
  const locale = useLocale();
  const t = tr(CONSTRUCTOR, locale);
  const shown = message ? tr(SIGNAGE, locale).logoErrors[message] ?? message : "";
  const labels: Record<BuyState, { full: string; short: string }> = {
    idle: { full: t.toCart, short: t.toCart },
    error: { full: t.toCart, short: t.toCart },
    uploading: { full: t.uploadingLogo, short: t.uploadingShort },
    added: { full: t.added, short: t.addedShort },
  };
  const unit = unitLabel ?? t.pcs;
  const disabled = !canBuy || state === "uploading";
  const totalText = total == null ? "—" : formatUAH(total);
  const each = unitPrice != null && qty > 1 ? `${formatUAH(unitPrice)} × ${qty}${unit ? ` ${unit}` : ""} · ` : "";
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
          <button type="button" onClick={onBuy} disabled={disabled} className="h-[52px] rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] disabled:opacity-40">{labels[state].full}</button>
        </div>
        {shown && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{shown}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <b className="text-xl tabular-nums">{totalText}</b>
        <button type="button" onClick={onBuy} disabled={disabled} className="h-12 rounded-full bg-[var(--buy)] px-7 font-bold text-[var(--buy-fg)] disabled:opacity-40">{labels[state].short}</button>
      </div>
    </>
  );
}
