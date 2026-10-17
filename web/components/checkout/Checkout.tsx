"use client";

// One-screen checkout (ТЗ §4.8): 4 required fields, everything else pre-selected,
// no registration. The order goes to Medusa (POST /store/tl-checkout), which recomputes
// every price; card payment continues on WayForPay. City and branch come from Nova Poshta
// (app/api/novaposhta), invoice requisites from Opendatabot (app/api/opendatabot); without
// their keys the fields stay plain inputs.

import Image from "next/image";
import Link from "@/components/i18n/LocaleLink";
import { useEffect, useMemo, useState } from "react";
import { cartTotals, toCartLine, useCart } from "@/store/cart-store";
import { cartLineItem, itemsValue } from "@/lib/analytics/analytics-item";
import { trackEvent } from "@/lib/analytics/track-event";
import { currentAttribution } from "@/lib/client/attribution-storage";
import { savePendingPurchase } from "@/lib/client/pending-purchase";
import { localePath } from "@/lib/i18n/locale-path";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { formatUAH } from "@/lib/format";
import { SITE } from "@/data/site";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { describeParcel, parcelFor } from "@/lib/calculators/packaging";
import { postJson } from "@/lib/client/api-client";
import { startWayForPay } from "@/lib/client/wayforpay";
import { checkoutAccountToken } from "@/lib/client/checkout-account-token";
import { firstErrorField, validateCheckout } from "@/lib/validation/checkout-form";
import { previewSvgOf } from "@/lib/validation/preview-svg";
import { needsLayoutApproval } from "@/lib/validation/layout-approval";
import type { B2BCompany } from "@/types/invoice";
import type { NpPriceResult } from "@/types/integrations";
import { CityField } from "./CityField";
import { CompanyFields, EMPTY_COMPANY } from "./CompanyFields";
import { WarehouseField } from "./WarehouseField";
import { CHECKOUT } from "@/lib/i18n/dictionaries/checkout";
import { tr } from "@/lib/i18n/translate";
import { INTL_TAG } from "@/lib/i18n/messages";
import type { Locale } from "@/types/customizer";

const DELIVERY = ["np_branch", "np_courier", "ukrposhta"] as const;
// LiqPay / Privat24 is offered again once its keys and payment route exist (QA 2026-10-10).
const PAYMENT = ["card", "cod", "invoice"] as const;

type PlacedOrder = { number: string; date: string; id: string; total: number; invoiceToken?: string | null };


const formatDate = (iso: string, locale: Locale) => new Intl.DateTimeFormat(INTL_TAG[locale], { day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00`));

export function Checkout() {
  const locale = useLocale();
  const t = tr(CHECKOUT, locale);
  const { items, clear } = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [form, setForm] = useState({ phone: "", name: "", city: "", cityRef: "", wh: "", whRef: "", delivery: "np_branch", payment: "card", comment: "", noCall: false });
  const [company, setCompany] = useState<B2BCompany>(EMPTY_COMPANY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<PlacedOrder | null>(null);
  const [payFailed, setPayFailed] = useState<PlacedOrder | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [quote, setQuote] = useState<NpPriceResult | null>(null);
  const { lines, total } = cartTotals(ready ? items : []);
  // GA4 items of the cart with the unit prices after the quantity discount.
  const analyticsItems = () => useCart.getState().items.map((line, index) => cartLineItem({ ...line, unitPrice: toCartLine(line).unitPrice }, index));
  useEffect(() => {
    if (!ready) return;
    const started = analyticsItems();
    if (started.length) trackEvent("begin_checkout", { value: itemsValue(started), items: started });
  }, [ready]);
  // «Лист погодження макета»: lines made to the customer's layout are sent only after «Макет перевірив».
  const toApprove = (ready ? items : []).filter(needsLayoutApproval);
  const [approved, setApproved] = useState(false);
  const approvalMissing = toApprove.length > 0 && !approved;
  // Editing a field removes its error message right away (QA m6).
  const clearError = (...keys: string[]) => setErrors((er) => {
    if (!keys.some((k) => er[k])) return er;
    const next = { ...er };
    for (const k of keys) delete next[k];
    return next;
  });
  const set = (k: keyof typeof form, v: string | boolean) => { setForm((f) => ({ ...f, [k]: v })); clearError(k, "server"); };

  // Accessories have no sheet size: only stencils, words and signs go into the parcel.
  const parcel = useMemo(() => parcelFor(
    (ready ? items : []).filter((i) => i.kind !== "accessory").map((i) => ({ materialId: i.materialId, widthMm: i.widthCm * 10, heightMm: i.heightCm * 10, quantity: i.quantity })),
    "tube",
  ), [items, ready]);

  // Nova Poshta price for the chosen city (only with the key; otherwise "за тарифом перевізника").
  useEffect(() => {
    setQuote(null);
    if (!form.cityRef || !parcel || form.delivery === "ukrposhta") return;
    const controller = new AbortController();
    postJson<NpPriceResult>("/api/novaposhta/price", {
      cityRecipientRef: form.cityRef,
      serviceType: form.delivery === "np_courier" ? "WarehouseDoors" : "WarehouseWarehouse",
      weightKg: parcel.billingKg,
      declaredValue: Math.max(1, total),
      lengthMm: parcel.lengthMm, widthMm: parcel.widthMm, heightMm: parcel.heightMm,
      codAmount: form.payment === "cod" ? total : 0,
    }, controller.signal)
      .then((result) => { if (result.ok) setQuote(result.data); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [form.cityRef, form.delivery, form.payment, parcel, total]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCheckout(form, company, locale);
    const er: Record<string, string> = { ...found };
    if (found.code) { er.company = found.code; delete er.code; }
    if (approvalMissing) er.approve = t.approvalMissing;
    setErrors(er);
    const first = firstErrorField(found) ?? (approvalMissing ? "approve" : null);
    if (first) {
      // Move the focus to the first wrong field, so the message is on screen and read out.
      const el = document.getElementById(`c-${first}`);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const ordered = analyticsItems();
    const orderedValue = itemsValue(ordered);
    trackEvent("add_shipping_info", { value: orderedValue, shipping_tier: form.delivery, items: ordered });
    trackEvent("add_payment_info", { value: orderedValue, payment_type: form.payment, items: ordered });
    setSending(true);
    try {
      const accountToken = await checkoutAccountToken();
      const r = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/tl-checkout`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PK ?? "" },
        body: JSON.stringify({
          lines: items.map((i) => ({ key: i.key, kind: i.kind ?? "stencil", title: i.title, quantity: i.quantity, variantId: i.variantId, materialId: i.materialId, widthCm: i.widthCm, heightCm: i.heightCm, sign: i.sign, pointer: i.pointer, plaque: i.plaque, words: i.words, layered: i.layered, initials: i.initials, letters: i.letters, blank: i.blank, uploadKey: i.uploadKey, spec: i.spec, previewSvg: previewSvgOf(i.vectorSvg) ?? undefined })),
          contact: { phone: form.phone, name: form.name, email: form.payment === "invoice" ? company.email : undefined },
          delivery: {
            method: form.delivery, city: form.city, cityRef: form.cityRef || undefined,
            warehouse: form.delivery === "np_courier" ? undefined : form.wh, warehouseRef: form.whRef || undefined,
            address: form.delivery === "np_courier" ? form.wh : undefined, pack: parcel?.kind,
          },
          payment: form.payment,
          company: form.payment === "invoice" ? company : undefined,
          comment: form.comment, noCall: form.noCall,
          layoutApproved: toApprove.length ? approved : undefined,
          website: honeypot,
          accountToken: accountToken ?? undefined,
          utm: currentAttribution(new Date()),
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        const codes: string[] = Array.isArray(data?.errors) ? data.errors : [];
        setErrors({ server: codes.includes("size_mismatch")
          ? t.serverSizeMismatch
          : codes.includes("layout_approval")
            ? t.serverApproval
          : codes.includes("rate_limited") || r.status === 429
            ? t.serverRateLimited
            : t.serverFailed });
        return;
      }
      const placed: PlacedOrder = {
        number: data.order.number, date: formatDispatch(estimateDispatchDate(new Date()), locale), id: data.order.id,
        // The amount the server computed, not the cart's own sum.
        total: Number(data.order.total) || 0,
        invoiceToken: typeof data.order.invoiceToken === "string" ? data.order.invoiceToken : null,
      };
      // The order exists now: the cart is cleared so a retry never creates a second order.
      clear();
      if (form.payment === "card") {
        // The purchase is reported when the buyer returns with the payment approved (PurchaseOnReturn).
        savePendingPurchase({ orderId: placed.id, orderNumber: placed.number, value: placed.total, paymentType: form.payment, items: ordered });
        // «Дякуємо» only after WayForPay confirms; if the payment cannot start, say so and offer a retry.
        if (!(await startWayForPay(placed.id, locale))) setPayFailed(placed);
        return;
      }
      trackEvent("purchase", { transaction_id: placed.number, value: placed.total, payment_type: form.payment, items: ordered });
      setDone(placed);
    } catch {
      setErrors({ server: t.serverOffline });
    } finally {
      setSending(false);
    }
  };

  if (!ready) return <div className="mx-auto max-w-[1040px] px-4 py-10 text-[var(--muted)]">{t.loading}</div>;

  if (payFailed) return (
    <div className="mx-auto grid max-w-[640px] justify-items-start gap-3 px-4 py-14">
      <h1 className="m-0 font-[family-name:var(--font-display)] text-3xl font-bold">{t.payFailedTitle}</h1>
      <p className="m-0 text-lg">{t.payFailedText(payFailed.number)}</p>
      <p role="status" className="m-0 text-[var(--muted)]">{t.payFailedHint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={retrying} className="rounded-full bg-[var(--buy)] px-6 py-3 font-bold text-[var(--buy-fg)] disabled:opacity-60"
          onClick={async () => { setRetrying(true); if (!(await startWayForPay(payFailed.id, locale))) setRetrying(false); }}>
          {retrying ? t.payOpening : t.payRetry}
        </button>
        <a href={SITE.viber} className="rounded-full px-6 py-3 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">{t.writeViber}</a>
      </div>
    </div>
  );

  if (done) return (
    <div className="mx-auto grid max-w-[640px] justify-items-start gap-3 px-4 py-14">
      <h1 className="m-0 font-[family-name:var(--font-display)] text-3xl font-bold">{t.thanksOrder(done.number)}</h1>
      {done.total > 0 && <p className="m-0 text-lg">{t.orderSum} <b className="tabular-nums">{formatUAH(done.total, locale)}</b>{form.payment === "cod" ? t.codNote : ""}.</p>}
      <p className="m-0 text-lg"><b>{done.date}</b>. {t.ttnNote}</p>
      <p className="m-0 text-[var(--muted)]">
        {t.customNote}
      </p>
      {form.payment === "invoice" && (
        <a href={localePath(locale, `/rakhunok/${done.id}?t=${encodeURIComponent(done.invoiceToken ?? "")}`)} className="font-semibold underline">{t.openInvoice}</a>
      )}
      <Link href="/" className="mt-2 rounded-full bg-[var(--buy)] px-6 py-3 font-bold text-[var(--buy-fg)]">{t.toHome}</Link>
    </div>
  );

  if (!lines.length) return (
    <div className="mx-auto grid max-w-[640px] justify-items-start gap-3 px-4 py-14">
      <h1 className="m-0 text-2xl font-bold">{t.emptyTitle}</h1>
      <p className="m-0 text-[var(--muted)]">{t.emptyText}</p>
      <div className="flex gap-2"><Link href="/catalog" className="rounded-full bg-[var(--buy)] px-5 py-2.5 font-bold text-[var(--buy-fg)]">{t.toCatalog}</Link><Link href="/konstruktor" className="rounded-full px-5 py-2.5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">{t.ownText}</Link></div>
    </div>
  );

  const field = (k: "phone" | "name" | "wh", label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="grid gap-1 text-sm text-[var(--muted)]">{label}
      <input id={`c-${k}`} value={form[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined}
        className={`h-12 rounded-xl border-[1.5px] bg-[var(--card)] px-3.5 text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none ${errors[k] ? "border-[var(--danger)]" : "border-[var(--line)]"}`} {...props} />
      {errors[k] && <span id={`e-${k}`} className="text-[13px] text-[var(--danger)]">{errors[k]}</span>}
    </label>
  );

  const deliveryLine = quote
    ? `${formatUAH(Math.round(quote.deliveryCost + quote.codFee), locale)}${quote.deliveryDate ? `, ${t.arrives(formatDate(quote.deliveryDate, locale))}` : ""}`
    : t.byCarrierTariff;

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-6 lg:px-8">
      <h1 className="m-0 mb-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,32px)] font-bold">{t.title}</h1>
      <p className="mt-0 mb-5 text-[var(--muted)]">{t.lead}</p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <fieldset className="m-0 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <legend className="px-1.5 font-bold">{t.contacts}</legend>
            {field("phone", t.phone, { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+38 0__ ___ __ __" })}
            {field("name", t.name, { autoComplete: "name", placeholder: t.namePlaceholder })}
          </fieldset>
          <fieldset className="m-0 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <legend className="px-1.5 font-bold">{t.delivery}</legend>
            {DELIVERY.map((v) => (
              <label key={v} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 ${form.delivery === v ? "border-[var(--ink)]" : "border-[var(--line)]"}`}>
                <input type="radio" name="delivery" id={`d-${v}`} checked={form.delivery === v} onChange={() => set("delivery", v)} className="accent-[var(--ink)]" />
                {v === "np_branch" && parcel && !parcel.fitsPostomat ? t.npBranchOnly : t.deliveryOptions[v]}
                <small className="ml-auto text-[var(--muted)]">{form.delivery === v && quote ? formatUAH(Math.round(quote.deliveryCost), locale) : t.byTariff}</small>
              </label>
            ))}
            <CityField value={form.city} cityRef={form.cityRef} error={errors.city}
              onChange={(city, cityRef) => { setForm((f) => ({ ...f, city, cityRef, wh: cityRef === f.cityRef ? f.wh : "", whRef: cityRef === f.cityRef ? f.whRef : "" })); clearError("city", "server"); }} />
            {form.delivery === "np_courier"
              ? field("wh", t.courierAddress, { autoComplete: "street-address" })
              : form.delivery === "np_branch"
                ? <WarehouseField cityRef={form.cityRef} value={form.wh} warehouseRef={form.whRef} parcel={parcel} error={errors.wh}
                    onChange={(wh, whRef) => { setForm((f) => ({ ...f, wh, whRef })); clearError("wh", "server"); }} />
                : field("wh", t.ukrposhtaBranch, { placeholder: t.ukrposhtaPlaceholder })}
          </fieldset>
          <fieldset className="m-0 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <legend className="px-1.5 font-bold">{t.payment}</legend>
            {PAYMENT.map((v) => {
              const [title, note] = t.paymentOptions[v];
              return (
              <label key={v} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 ${form.payment === v ? "border-[var(--ink)]" : "border-[var(--line)]"}`}>
                <input type="radio" name="payment" id={`p-${v}`} checked={form.payment === v} onChange={() => set("payment", v)} className="accent-[var(--ink)]" />{title}
                {note && <small className="ml-auto text-[var(--muted)]">{note}</small>}
              </label>
              );
            })}
          </fieldset>
          {form.payment === "invoice" && <CompanyFields value={company} error={errors.company} onChange={(c) => { setCompany(c); clearError("company", "server"); }} />}
          <details className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <summary className="cursor-pointer font-semibold">{t.comment}</summary>
            <label htmlFor="c-comment" className="sr-only">{t.commentLabel}</label>
            <textarea id="c-comment" rows={3} value={form.comment} onChange={(e) => set("comment", e.target.value)} className="mt-3 w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3" />
          </details>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="c-nocall" checked={form.noCall} onChange={(e) => set("noCall", e.target.checked)} className="accent-[var(--ink)]" />{t.noCall}</label>
          {toApprove.length > 0 && (
            <fieldset className="m-0 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
              <legend className="px-1.5 font-bold">{t.approvalTitle}</legend>
              <p className="m-0 text-sm text-[var(--muted)]">{t.approvalLead}</p>
              {toApprove.map((item) => (
                <div key={item.id} className="grid grid-cols-[96px_1fr] items-center gap-3 text-sm">
                  <span className="h-24 w-24 overflow-hidden rounded-lg bg-[var(--surface)]">{item.vectorSvg
                    ? <span role="img" aria-label={t.layoutOf(item.title)} className="block h-full w-full p-1.5 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: item.vectorSvg }} />
                    : <span className="grid h-full place-items-center p-1.5 text-center text-[11px] text-[var(--muted)]">{item.uploadKey ? t.yourFile : t.noPicture}</span>}</span>
                  <span>{item.title}<br /><span className="text-[var(--muted)]">{item.widthCm} × {item.heightCm} см · {item.quantity} {t.pieces}{item.uploadKey ? ` · ${t.managerChecksFile}` : ""}</span></span>
                </div>
              ))}
              <label className="flex items-start gap-2 text-sm font-semibold">
                <input type="checkbox" id="c-approve" checked={approved} aria-invalid={!!errors.approve} aria-describedby={errors.approve ? "e-approve" : undefined}
                  onChange={(e) => { setApproved(e.target.checked); clearError("approve", "server"); }} className="mt-0.5 accent-[var(--ink)]" />
                {t.approvalCheck}
              </label>
              {errors.approve && <span id="e-approve" className="text-[13px] text-[var(--danger)]">{errors.approve}</span>}
            </fieldset>
          )}
          <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
            <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
          </div>
          {errors.server && <p role="alert" className="m-0 rounded-xl bg-[var(--surface)] p-3 text-sm text-[var(--danger)]">{errors.server}</p>}
          <button type="submit" disabled={sending || approvalMissing} aria-describedby={approvalMissing ? "c-approve-hint" : undefined} className="disabled:opacity-60 h-14 rounded-full bg-[var(--buy)] text-lg font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] active:scale-[.98]">{sending ? t.sending : t.confirm(formatUAH(total, locale))}</button>
          {approvalMissing && <p id="c-approve-hint" className="m-0 text-[13px] text-[var(--muted)]">{t.approvalHint}</p>}
          <p className="m-0 text-[13px] text-[var(--muted)]">{t.agreeBefore} <Link href="/oferta" className="underline">{t.offer}</Link> {t.agreeAnd} <Link href="/polityka-konfidentsiinosti" className="underline">{t.privacy}</Link>. {t.agreeAfter}</p>
        </form>

        <aside aria-label={t.yourOrder} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 lg:sticky lg:top-24">
          <b>{t.yourOrder}</b>
          {lines.map((l) => (
            <div key={l.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-2.5 text-sm">
              <span className="relative h-14 w-14 overflow-hidden rounded-lg bg-[var(--surface)]">{l.vectorSvg
                ? <span role="img" aria-label={l.title} className="block h-full w-full p-1 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: l.vectorSvg }} />
                : l.thumbnail && <Image src={l.thumbnail} alt="" fill sizes="56px" className="object-cover" />}</span>
              <span>{l.title}<br /><span className="text-[var(--muted)]">{l.quantity} {t.pieces} × {formatUAH(l.unitPrice, locale)}</span></span>
              <b className="tabular-nums">{formatUAH(l.unitPrice * l.quantity, locale)}</b>
            </div>
          ))}
          {parcel && <div className="flex justify-between gap-3 text-[13px] text-[var(--muted)]"><span>{t.parcel}</span><span className="text-right">{describeParcel(parcel, locale)}</span></div>}
          <div className="flex justify-between gap-3 text-[15px]"><span>{t.delivery}</span><span className="text-right">{deliveryLine}</span></div>
          <div className="flex justify-between border-t border-[var(--line)] pt-2.5 text-xl font-bold"><span>{t.toPay}</span><span className="tabular-nums">{formatUAH(total, locale)}</span></div>
          {quote && <p className="m-0 text-[12px] text-[var(--muted)]">{t.deliveryPaidOnReceipt}</p>}
        </aside>
      </div>
    </div>
  );
}
