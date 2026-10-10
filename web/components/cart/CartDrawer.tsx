"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { MATERIALS } from "../../lib/materials";
import { nextTierHint } from "../../lib/calculators/pricing";
import { formatUAH } from "../../lib/format";
import { isFlexible, parcelFor } from "../../lib/calculators/packaging";
import type { PackKind } from "../../types/packaging";
import type { CartLine, Locale, Upsell } from "../../types/customizer";
import { msg } from "../../lib/i18n";
import { useFocusTrap } from "../../lib/useFocusTrap";

/**
 * Floating cart: a pill button that appears once the cart has items, and a drawer
 * (right side on desktop, bottom sheet on phones).
 *
 * State lives in the Medusa cart; callbacks are expected to update it optimistically
 * (change local state first, then call the Store API, roll back on error).
 * Express payment buttons (Apple Pay / Google Pay via WayForPay or LiqPay) are passed
 * in as `expressCheckout`, because they are rendered by the payment provider's SDK.
 */
export type BuyerType = "b2c" | "b2b";

export interface CartDrawerProps {
  lines: CartLine[];
  upsells?: Upsell[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuantity: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onAddUpsell?: (u: Upsell) => void;
  onCheckout: (buyer: BuyerType) => void;
  /** B2B: create a PDF invoice (рахунок для ФОП/ТОВ) from the cart. */
  onInvoice?: () => void;
  expressCheckout?: ReactNode;
  productionNote?: string;
  /** Called when the customer switches tube / flat pack (only offered for PET ≤ 0.8 mm). */
  onPackChange?: (kind: PackKind) => void;
  /** "Від 500 ₴ — подарунок": admin option, null = off. */
  gift?: { thresholdUah: number; title: string } | null;
  /** From lib/production.ts formatDispatch(estimateDispatchDate()). */
  dispatchText?: string;
  /** Site language: uk (default), ru, en. */
  locale?: Locale;
}

export function CartDrawer({
  lines, upsells = [], open, onOpenChange, onQuantity, onRemove, onAddUpsell, onCheckout, onInvoice,
  expressCheckout, productionNote, onPackChange, gift = null, dispatchText, locale = "uk",
}: CartDrawerProps) {
  const t = msg(locale).cart;
  const panel = useRef<HTMLElement>(null);
  const [buyer, setBuyer] = useState<BuyerType>("b2c");
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const desktop = useMediaQuery("(min-width: 768px)");
  useFocusTrap(panel, open, close);

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  // Parcel per lib/parcel.ts: tube for PET ≤ 0.8 mm (customer may choose flat), flat pack otherwise.
  const [pack, setPack] = useState<PackKind>("tube");
  const canRoll = lines.length > 0 && lines.every((l) => isFlexible(l.materialId));
  const parcel = parcelFor(lines.map((l) => ({ materialId: l.materialId, widthMm: l.widthCm * 10, heightMm: l.heightCm * 10, quantity: l.quantity })), pack);
  const cm = (mm: number) => Math.ceil(mm / 10);
  const kg = (value: number) => (Math.ceil(value * 10) / 10).toFixed(1).replace(".", locale === "en" ? "." : ",");
  // Closest quantity tier among the lines: "Додайте ще 3 шт. «…», щоб отримати −5 %".
  const tier = lines
    .map((l) => ({ l, h: nextTierHint(l.quantity) }))
    .filter((x): x is { l: CartLine; h: NonNullable<ReturnType<typeof nextTierHint>> } => x.h !== null && x.h.addQty <= 10)
    .sort((a, b) => a.h.addQty - b.h.addQty)[0];
  const giftLeft = gift ? gift.thresholdUah - total : 0;
  const freshUpsells = upsells.filter((u) => !lines.some((l) => l.id === u.id)).slice(0, 2);

  return (
    <>
      <CartFab count={count} total={total} label={t.fab(count, formatUAH(total))} onClick={() => onOpenChange(true)} />

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-[#0f1d33]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
            <motion.section
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-title"
              initial="hidden"
              animate="shown"
              exit="hidden"
              variants={{ hidden: desktop ? { x: "100%", y: 0 } : { x: 0, y: "100%" }, shown: { x: 0, y: 0 } }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-[20px] bg-[var(--bg)] text-[var(--ink)] shadow-2xl
                         md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              <header className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-3.5">
                <h2 id="cart-title" className="flex-1 text-lg font-bold">{t.title}</h2>
                <button type="button" onClick={close} aria-label={t.close} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] text-xl">×</button>
              </header>

              <div className="min-h-0 flex-1 overflow-auto px-5 py-3">
                {lines.length === 0 && <p className="py-8 text-center text-[var(--muted)]">{t.empty}</p>}

                <ul>
                  {lines.map((l) => (
                    <motion.li layout key={l.id} className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--line)] py-3">
                      <div className="relative aspect-[4/3] w-24 overflow-hidden rounded-lg border border-[var(--line)] bg-white">
                        {l.vectorSvg ? (
                          // Cut-file preview from our own constructor renderer (trusted, sanitised server-side).
                          <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: l.vectorSvg }} aria-label={t.cutFile(l.title)} role="img" />
                        ) : l.thumbnail ? (
                          <Image src={l.thumbnail} alt="" fill sizes="96px" className="object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug">{l.title}</h3>
                        <p className="font-mono text-xs text-[var(--muted)]">{l.widthCm}×{l.heightCm} {t.cm} · {MATERIALS[l.materialId].name[locale]}</p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <div className="inline-flex items-center rounded-full border-[1.5px] border-[var(--line)]">
                            <button type="button" aria-label={t.less} className="h-9 w-9" onClick={() => (l.quantity > 1 ? onQuantity(l.id, l.quantity - 1) : onRemove(l.id))}>−</button>
                            <output className="min-w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{l.quantity}</output>
                            <button type="button" aria-label={t.more} className="h-9 w-9" onClick={() => onQuantity(l.id, l.quantity + 1)}>+</button>
                          </div>
                          <button type="button" className="text-xs text-[var(--muted)] underline" onClick={() => onRemove(l.id)}>{t.remove}</button>
                        </div>
                      </div>
                      <div className="text-right font-bold tabular-nums">{formatUAH(l.unitPrice * l.quantity)}</div>
                    </motion.li>
                  ))}
                </ul>

                {tier && (
                  <Progress
                    value={tier.h.progress}
                    text={t.tierHint(tier.h.addQty, tier.l.title, Math.round(tier.h.nextDiscount * 100))}
                    action={<button type="button" className="text-xs font-semibold underline" onClick={() => onQuantity(tier.l.id, tier.l.quantity + tier.h.addQty)}>{t.add}</button>}
                  />
                )}
                {gift && lines.length > 0 && (
                  <Progress
                    value={Math.min(1, total / gift.thresholdUah)}
                    text={giftLeft > 0 ? t.giftLeft(formatUAH(giftLeft), gift.title) : t.giftDone(gift.title)}
                  />
                )}
                {parcel && (
                  <div className="my-3.5 grid grid-cols-2 gap-2 text-[13px] text-[var(--muted)]">
                    <div className="rounded-xl bg-[var(--surface)] px-3 py-2.5">
                      {parcel.volumetricKg > parcel.actualKg ? t.weightVolumetric : t.weight}
                      <b className="block text-base text-[var(--ink)] tabular-nums">{kg(parcel.billingKg)} {t.kg}</b>
                      {parcel.volumetricKg > parcel.actualKg && <span className="block text-[12px]">{t.actualWeight(kg(parcel.actualKg))}</span>}
                    </div>
                    <div className="rounded-xl bg-[var(--surface)] px-3 py-2.5">{t.size}<b className="block text-base text-[var(--ink)] tabular-nums">{cm(parcel.lengthMm)}×{cm(parcel.widthMm)}×{cm(parcel.heightMm)} {t.cm}</b></div>
                    {canRoll && (
                      <div role="radiogroup" aria-label={t.packing} className="col-span-2 inline-flex justify-self-start rounded-full border-[1.5px] border-[var(--line)] p-[3px]">
                        {(["tube", "flat"] as const).map((k) => (
                          <button key={k} type="button" role="radio" aria-checked={pack === k} onClick={() => { setPack(k); onPackChange?.(k); }}
                            className={`h-9 rounded-full px-3.5 text-[13px] font-medium ${pack === k ? "bg-[var(--inv-bg)] text-[var(--inv-fg)]" : "text-[var(--ink)]"}`}>
                            {k === "tube" ? t.tube : t.flat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {onAddUpsell && freshUpsells.map((u) => (
                  <div key={u.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[var(--line)] px-3.5 py-3">
                    <div className="min-w-0 flex-1 text-sm"><b className="block">{u.title}</b>{u.reason}</div>
                    <button type="button" onClick={() => onAddUpsell(u)} className="h-10 whitespace-nowrap rounded-full border-[1.5px] border-[var(--ink)] px-3.5 font-semibold">+ {formatUAH(u.price)}</button>
                  </div>
                ))}
              </div>

              {lines.length > 0 && (
                <footer className="space-y-3 border-t border-[var(--line)] px-5 py-3.5">
                  <div role="radiogroup" aria-label={t.whoBuys} className="inline-flex rounded-full border-[1.5px] border-[var(--line)] p-[3px] text-sm">
                    {(["b2c", "b2b"] as const).map((b) => (
                      <button key={b} type="button" role="radio" aria-checked={buyer === b} onClick={() => setBuyer(b)}
                        className={`h-9 rounded-full px-3.5 font-medium ${buyer === b ? "bg-[var(--inv-bg)] text-[var(--inv-fg)]" : ""}`}>
                        {b === "b2c" ? t.b2c : t.b2b}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="min-w-0 flex-1">
                      <b className="block text-2xl tabular-nums">{formatUAH(total)}</b>
                      <span className="text-[13px] text-[var(--muted)]">{dispatchText ?? productionNote ?? t.production}</span>
                    </div>
                    <button type="button" onClick={() => onCheckout(buyer)} className="h-[52px] rounded-full bg-[var(--buy)] px-7 text-[17px] font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] active:bg-[var(--buy-active)]">
                      {t.checkout}
                    </button>
                  </div>

                  {buyer === "b2c" && expressCheckout}
                  {buyer === "b2b" && onInvoice && (
                    <button type="button" onClick={onInvoice} className="h-11 w-full rounded-full border-[1.5px] border-[var(--ink)] font-semibold">
                      {t.invoice}
                    </button>
                  )}
                </footer>
              )}
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Progress({ value, text, action }: { value: number; text: string; action?: ReactNode }) {
  return (
    <div className="my-3 rounded-xl bg-[var(--surface)] px-3 py-2.5" role="status">
      <div className="flex items-center gap-2 text-[13px]"><span className="min-w-0 flex-1">{text}</span>{action}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden="true">
        <div className="h-full rounded-full bg-[var(--buy)] transition-[width] duration-300" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

function CartFab({ count, total, onClick, label }: { count: number; total: number; onClick: () => void; label: string }) {
  const [pulse, setPulse] = useState(0);
  const prev = useRef(count);
  useEffect(() => { if (count > (prev.current ?? 0)) setPulse((p) => p + 1); prev.current = count; }, [count]);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          key="fab"
          type="button"
          onClick={onClick}
          initial={{ y: 80 }}
          animate={{ y: 0, scale: pulse ? [1, 1.08, 1] : 1 }}
          exit={{ y: 80 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          aria-label={label}
          className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-4 z-30 flex h-[54px] items-center gap-2.5 rounded-full bg-[var(--inv-bg)] pl-4 pr-5 font-semibold text-[var(--inv-fg)] shadow-xl tabular-nums"
        >
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[var(--inv-fg)] text-[13px] text-[var(--inv-bg)]">{count}</span>
          {formatUAH(total)}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatch(mq.matches);
    const on = (e: MediaQueryListEvent) => setMatch(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}
