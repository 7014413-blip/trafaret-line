"use client";

// One-screen checkout (ТЗ §4.8): 4 required fields, everything else pre-selected,
// no registration. The order goes to Medusa (POST /store/tl-checkout), which recomputes
// every price; card payment continues on WayForPay. City and branch come from Nova Poshta
// (app/api/novaposhta), invoice requisites from Opendatabot (app/api/opendatabot); without
// their keys the fields stay plain inputs.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cartTotals, useCart } from "@/store/cart-store";
import { formatUAH } from "@/lib/format";
import { SITE } from "@/data/site";
import { estimateDispatchDate, formatDispatch } from "@/lib/production";
import { describeParcel, parcelFor } from "@/lib/calculators/packaging";
import { postJson } from "@/lib/client/api-client";
import { startWayForPay } from "@/lib/client/wayforpay";
import { firstErrorField, validateCheckout } from "@/lib/validation/checkout-form";
import type { B2BCompany } from "@/types/invoice";
import type { NpPriceResult } from "@/types/integrations";
import { CityField } from "./CityField";
import { CompanyFields, EMPTY_COMPANY } from "./CompanyFields";
import { WarehouseField } from "./WarehouseField";

const DELIVERY = [
  ["np_branch", "Нова пошта: відділення або поштомат"],
  ["np_courier", "Нова пошта: курʼєр"],
  ["ukrposhta", "Укрпошта"],
] as const;
const PAYMENT = [
  // LiqPay / Privat24 is offered again once its keys and payment route exist (QA 2026-10-10).
  ["card", "Карткою онлайн, Apple Pay, Google Pay", "WayForPay"],
  ["cod", "Накладений платіж при отриманні", ""],
  ["invoice", "За рахунком для ФОП і ТОВ", "без ПДВ"],
] as const;

type PlacedOrder = { number: string; date: string; id: string; total: number; invoiceToken?: string | null };


const formatDate = (iso: string) => new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00`));

export function Checkout() {
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
    const found = validateCheckout(form, company);
    const er: Record<string, string> = { ...found };
    if (found.code) { er.company = found.code; delete er.code; }
    setErrors(er);
    const first = firstErrorField(found);
    if (first) {
      // Move the focus to the first wrong field, so the message is on screen and read out.
      const el = document.getElementById(`c-${first}`);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setSending(true);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/tl-checkout`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PK ?? "" },
        body: JSON.stringify({
          lines: items.map((i) => ({ key: i.key, kind: i.kind ?? "stencil", title: i.title, quantity: i.quantity, variantId: i.variantId, materialId: i.materialId, widthCm: i.widthCm, heightCm: i.heightCm, sign: i.sign, pointer: i.pointer, plaque: i.plaque, words: i.words, layered: i.layered, initials: i.initials, letters: i.letters, blank: i.blank, uploadKey: i.uploadKey, spec: i.spec })),
          contact: { phone: form.phone, name: form.name, email: form.payment === "invoice" ? company.email : undefined },
          delivery: {
            method: form.delivery, city: form.city, cityRef: form.cityRef || undefined,
            warehouse: form.delivery === "np_courier" ? undefined : form.wh, warehouseRef: form.whRef || undefined,
            address: form.delivery === "np_courier" ? form.wh : undefined, pack: parcel?.kind,
          },
          payment: form.payment,
          company: form.payment === "invoice" ? company : undefined,
          comment: form.comment, noCall: form.noCall,
          website: honeypot,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        const codes: string[] = Array.isArray(data?.errors) ? data.errors : [];
        setErrors({ server: codes.includes("size_mismatch")
          ? "Розмір виробу в кошику не збігається з макетом. Відкрийте конструктор, додайте напис у кошик ще раз і оформіть замовлення."
          : codes.includes("rate_limited") || r.status === 429
            ? "Забагато спроб оформлення. Зачекайте кілька хвилин або напишіть нам у Viber."
            : "Не вдалося оформити замовлення. Перевірте дані або напишіть нам у Viber." });
        return;
      }
      const placed: PlacedOrder = {
        number: data.order.number, date: formatDispatch(estimateDispatchDate(new Date())), id: data.order.id,
        // The amount the server computed, not the cart's own sum.
        total: Number(data.order.total) || 0,
        invoiceToken: typeof data.order.invoiceToken === "string" ? data.order.invoiceToken : null,
      };
      // The order exists now: the cart is cleared so a retry never creates a second order.
      clear();
      if (form.payment === "card") {
        // «Дякуємо» only after WayForPay confirms; if the payment cannot start, say so and offer a retry.
        if (!(await startWayForPay(placed.id))) setPayFailed(placed);
        return;
      }
      setDone(placed);
    } catch {
      setErrors({ server: "Немає звʼязку з магазином. Спробуйте ще раз за хвилину." });
    } finally {
      setSending(false);
    }
  };

  if (!ready) return <div className="mx-auto max-w-[1040px] px-4 py-10 text-[var(--muted)]">Завантаження кошика…</div>;

  if (payFailed) return (
    <div className="mx-auto grid max-w-[640px] justify-items-start gap-3 px-4 py-14">
      <h1 className="m-0 font-[family-name:var(--font-display)] text-3xl font-bold">Оплата не запустилася</h1>
      <p className="m-0 text-lg">Замовлення {payFailed.number} збережено, але платіжна сторінка не відкрилася. Гроші не списано.</p>
      <p role="status" className="m-0 text-[var(--muted)]">Спробуйте ще раз або напишіть нам у Viber, і ми надішлемо посилання на оплату чи переведемо замовлення на оплату при отриманні.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={retrying} className="rounded-full bg-[var(--buy)] px-6 py-3 font-bold text-[var(--buy-fg)] disabled:opacity-60"
          onClick={async () => { setRetrying(true); if (!(await startWayForPay(payFailed.id))) setRetrying(false); }}>
          {retrying ? "Відкриваємо оплату…" : "Спробувати оплатити ще раз"}
        </button>
        <a href={SITE.viber} className="rounded-full px-6 py-3 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">Написати у Viber</a>
      </div>
    </div>
  );

  if (done) return (
    <div className="mx-auto grid max-w-[640px] justify-items-start gap-3 px-4 py-14">
      <h1 className="m-0 font-[family-name:var(--font-display)] text-3xl font-bold">Дякуємо! Замовлення {done.number}</h1>
      {done.total > 0 && <p className="m-0 text-lg">Сума замовлення: <b className="tabular-nums">{formatUAH(done.total)}</b>{form.payment === "cod" ? ", оплата при отриманні" : ""}.</p>}
      <p className="m-0 text-lg"><b>{done.date}</b>. Номер ТТН надішлемо у Viber або Telegram.</p>
      <p className="m-0 text-[var(--muted)]">
        Для індивідуальних виробів спершу надішлемо превʼю макета на погодження.
      </p>
      {form.payment === "invoice" && (
        <a href={`/rakhunok/${done.id}?t=${encodeURIComponent(done.invoiceToken ?? "")}`} className="font-semibold underline">Відкрити рахунок на оплату (можна зберегти в PDF)</a>
      )}
      <Link href="/" className="mt-2 rounded-full bg-[var(--buy)] px-6 py-3 font-bold text-[var(--buy-fg)]">На головну</Link>
    </div>
  );

  if (!lines.length) return (
    <div className="mx-auto grid max-w-[640px] justify-items-start gap-3 px-4 py-14">
      <h1 className="m-0 text-2xl font-bold">У кошику порожньо</h1>
      <p className="m-0 text-[var(--muted)]">Оберіть трафарет у каталозі або зробіть свій напис.</p>
      <div className="flex gap-2"><Link href="/catalog" className="rounded-full bg-[var(--buy)] px-5 py-2.5 font-bold text-[var(--buy-fg)]">До каталогу</Link><Link href="/konstruktor" className="rounded-full px-5 py-2.5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">Свій напис</Link></div>
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
    ? `${formatUAH(Math.round(quote.deliveryCost + quote.codFee))}${quote.deliveryDate ? `, прибуде ${formatDate(quote.deliveryDate)}` : ""}`
    : "за тарифом перевізника";

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-6 lg:px-8">
      <h1 className="m-0 mb-1 font-[family-name:var(--font-display)] text-[clamp(24px,3vw,32px)] font-bold">Оформлення замовлення</h1>
      <p className="mt-0 mb-5 text-[var(--muted)]">Чотири поля, без реєстрації.</p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <fieldset className="m-0 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <legend className="px-1.5 font-bold">Контакти</legend>
            {field("phone", "Телефон", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+38 0__ ___ __ __" })}
            {field("name", "Імʼя та прізвище", { autoComplete: "name", placeholder: "Як у паспорті для Нової пошти" })}
          </fieldset>
          <fieldset className="m-0 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <legend className="px-1.5 font-bold">Доставка</legend>
            {DELIVERY.map(([v, t]) => (
              <label key={v} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 ${form.delivery === v ? "border-[var(--ink)]" : "border-[var(--line)]"}`}>
                <input type="radio" name="delivery" id={`d-${v}`} checked={form.delivery === v} onChange={() => set("delivery", v)} className="accent-[var(--ink)]" />{t}
                <small className="ml-auto text-[var(--muted)]">{form.delivery === v && quote ? formatUAH(Math.round(quote.deliveryCost)) : "за тарифом"}</small>
              </label>
            ))}
            <CityField value={form.city} cityRef={form.cityRef} error={errors.city}
              onChange={(city, cityRef) => { setForm((f) => ({ ...f, city, cityRef, wh: cityRef === f.cityRef ? f.wh : "", whRef: cityRef === f.cityRef ? f.whRef : "" })); clearError("city", "server"); }} />
            {form.delivery === "np_courier"
              ? field("wh", "Адреса: вулиця, будинок, квартира", { autoComplete: "street-address" })
              : form.delivery === "np_branch"
                ? <WarehouseField cityRef={form.cityRef} value={form.wh} warehouseRef={form.whRef} parcel={parcel} error={errors.wh}
                    onChange={(wh, whRef) => { setForm((f) => ({ ...f, wh, whRef })); clearError("wh", "server"); }} />
                : field("wh", "Відділення Укрпошти або індекс", { placeholder: "Номер відділення або індекс" })}
          </fieldset>
          <fieldset className="m-0 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <legend className="px-1.5 font-bold">Оплата</legend>
            {PAYMENT.map(([v, t, note]) => (
              <label key={v} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] px-3.5 py-3 ${form.payment === v ? "border-[var(--ink)]" : "border-[var(--line)]"}`}>
                <input type="radio" name="payment" id={`p-${v}`} checked={form.payment === v} onChange={() => set("payment", v)} className="accent-[var(--ink)]" />{t}
                {note && <small className="ml-auto text-[var(--muted)]">{note}</small>}
              </label>
            ))}
          </fieldset>
          {form.payment === "invoice" && <CompanyFields value={company} error={errors.company} onChange={(c) => { setCompany(c); clearError("company", "server"); }} />}
          <details className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <summary className="cursor-pointer font-semibold">Коментар або інший отримувач</summary>
            <label htmlFor="c-comment" className="sr-only">Коментар до замовлення або дані іншого отримувача</label>
            <textarea id="c-comment" rows={3} value={form.comment} onChange={(e) => set("comment", e.target.value)} className="mt-3 w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3" />
          </details>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="c-nocall" checked={form.noCall} onChange={(e) => set("noCall", e.target.checked)} className="accent-[var(--ink)]" />Не передзвонюйте, все вірно</label>
          <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
            <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} /></label>
          </div>
          {errors.server && <p role="alert" className="m-0 rounded-xl bg-[var(--surface)] p-3 text-sm text-[var(--danger)]">{errors.server}</p>}
          <button type="submit" disabled={sending} className="disabled:opacity-60 h-14 rounded-full bg-[var(--buy)] text-lg font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] active:scale-[.98]">{sending ? "Оформлюємо…" : `Підтвердити замовлення · ${formatUAH(total)}`}</button>
          <p className="m-0 text-[13px] text-[var(--muted)]">Натискаючи кнопку, ви погоджуєтесь з <Link href="/oferta" className="underline">публічною офертою</Link> і <Link href="/polityka-konfidentsiinosti" className="underline">політикою конфіденційності</Link>. Чек надійде від Вчасно.Каси.</p>
        </form>

        <aside aria-label="Ваше замовлення" className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 lg:sticky lg:top-24">
          <b>Ваше замовлення</b>
          {lines.map((l) => (
            <div key={l.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-2.5 text-sm">
              <span className="relative h-14 w-14 overflow-hidden rounded-lg bg-[var(--surface)]">{l.vectorSvg
                ? <span role="img" aria-label={l.title} className="block h-full w-full p-1 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: l.vectorSvg }} />
                : l.thumbnail && <Image src={l.thumbnail} alt="" fill sizes="56px" className="object-cover" />}</span>
              <span>{l.title}<br /><span className="text-[var(--muted)]">{l.quantity} шт. × {formatUAH(l.unitPrice)}</span></span>
              <b className="tabular-nums">{formatUAH(l.unitPrice * l.quantity)}</b>
            </div>
          ))}
          {parcel && <div className="flex justify-between gap-3 text-[13px] text-[var(--muted)]"><span>Посилка</span><span className="text-right">{describeParcel(parcel)}</span></div>}
          <div className="flex justify-between gap-3 text-[15px]"><span>Доставка</span><span className="text-right">{deliveryLine}</span></div>
          <div className="flex justify-between border-t border-[var(--line)] pt-2.5 text-xl font-bold"><span>До сплати</span><span className="tabular-nums">{formatUAH(total)}</span></div>
          {quote && <p className="m-0 text-[12px] text-[var(--muted)]">Доставку оплачуєте перевізнику при отриманні.</p>}
        </aside>
      </div>
    </div>
  );
}
