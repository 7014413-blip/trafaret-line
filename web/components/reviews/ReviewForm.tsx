"use client";
// Review of a received order (ТЗ §4.10): the buyer picks a product of the order (or the order
// as a whole), puts stars, writes a few words and adds up to 5 photos. Each review is sent on
// its own; after sending, the next product without a review is offered. Reviews show on the
// site after moderation.

import Image from "next/image";
import { useId, useMemo, useState } from "react";
import type { ReviewInputField, ReviewSubject } from "@/types/reviews";
import { REVIEW_LIMITS } from "@/lib/reviews/review-limits";
import { validateReviewInput } from "@/lib/reviews/validate-review";
import { resizePhoto, type ReducedPhoto } from "@/lib/client/resize-photo";
import { sendReview } from "@/lib/client/send-review";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { REVIEW_FORM } from "@/lib/i18n/dictionaries/review-form";
import { tr } from "@/lib/i18n/translate";
import { StarInput } from "./StarInput";

type Errors = Partial<Record<ReviewInputField, string>>;

const inputClass = "w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2.5 text-base";

export function ReviewForm({ orderId, token, orderNumber, subjects: initial }: {
  orderId: string;
  token: string;
  orderNumber: string;
  subjects: ReviewSubject[];
}) {
  const locale = useLocale();
  const t = tr(REVIEW_FORM, locale);
  const say = (m: string) => t.messages[m] ?? m;
  const sayAll = (e: Errors): Errors => Object.fromEntries(Object.entries(e).map(([f, m]) => [f, m && say(m)]));
  const ids = useId();
  const [subjects, setSubjects] = useState(initial);
  const [key, setKey] = useState(() => initial.find((s) => !s.reviewed)?.key ?? "");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<ReducedPhoto[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(0);

  const open = useMemo(() => subjects.filter((s) => !s.reviewed), [subjects]);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = REVIEW_LIMITS.photosMax - photos.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    setBusy(true);
    try {
      const reduced: ReducedPhoto[] = [];
      for (const file of chosen) reduced.push(await resizePhoto(file));
      setPhotos((current) => [...current, ...reduced].slice(0, REVIEW_LIMITS.photosMax));
      setErrors((e) => ({ ...e, photos: files.length > room ? t.photosMax(REVIEW_LIMITS.photosMax) : undefined }));
    } catch (e) {
      setErrors((current) => ({ ...current, photos: say((e as Error).message) }));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    const check = validateReviewInput({ key, name, city, rating, text, photos: photos.map((p) => p.base64) });
    if (!check.ok) {
      setErrors(sayAll(check.errors));
      const first = (["key", "rating", "text", "name", "city", "photos"] as const).find((f) => check.errors[f]);
      if (first) document.getElementById(`${ids}-${first}`)?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    const result = await sendReview(orderId, token, check.value);
    setBusy(false);
    if (!result.ok && !result.alreadySent) {
      setErrors(sayAll(result.errors ?? {}));
      setMessage(say(result.message));
      return;
    }
    const next = subjects.map((s) => (s.key === key ? { ...s, reviewed: true } : s));
    setSubjects(next);
    setSent((n) => n + 1);
    setRating(0);
    setText("");
    setPhotos([]);
    setKey(next.find((s) => !s.reviewed)?.key ?? "");
    setMessage(result.ok ? t.thanksPending : say(result.message));
  };

  if (!open.length) {
    return (
      <div className="grid gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5" role="status">
        <h2 className="m-0 text-xl font-bold">{sent ? t.thanks : t.allSent}</h2>
        <p className="m-0 text-[var(--muted)]">{t.afterCheck}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
      <p className="m-0 text-[var(--muted)]">{t.order(orderNumber)}</p>
      {message && <p className="m-0 rounded-xl bg-[var(--surface)] p-3" role="status">{message}</p>}

      <fieldset className="m-0 grid gap-2 border-0 p-0">
        <legend className="mb-1 font-semibold">{t.subject}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {subjects.map((s, i) => (
            <label key={s.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 ${s.key === key ? "border-[var(--ink)]" : "border-[var(--line)]"} ${s.reviewed ? "opacity-60" : ""}`}>
              <input id={i === 0 ? `${ids}-key` : undefined} type="radio" name="rv-subject" value={s.key} checked={s.key === key} disabled={s.reviewed} onChange={() => setKey(s.key)} className="sr-only" />
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--surface)]">
                {s.image && <Image src={s.image} alt="" fill sizes="56px" className="object-cover" />}
              </span>
              <span className="grid text-sm">
                <span className="font-medium">{s.productHandle ? s.title : t.wholeOrder(s.title)}</span>
                {s.reviewed && <span className="text-[var(--muted)]">{t.reviewed}</span>}
              </span>
            </label>
          ))}
        </div>
        {errors.key && <p className="m-0 text-sm text-[var(--danger)]">{errors.key}</p>}
      </fieldset>

      <div id={`${ids}-rating`} tabIndex={-1}>
        <StarInput value={rating} onChange={setRating} error={errors.rating} label={t.rating} words={t.ratingWords} ratingOf={t.ratingOf} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={`${ids}-text`} className="font-semibold">{t.yourReview}</label>
        <textarea id={`${ids}-text`} rows={5} maxLength={REVIEW_LIMITS.textMax} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder} className={inputClass} aria-invalid={!!errors.text} />
        {errors.text && <p className="m-0 text-sm text-[var(--danger)]">{errors.text}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor={`${ids}-name`} className="font-semibold">{t.name}</label>
          <input id={`${ids}-name`} value={name} maxLength={REVIEW_LIMITS.nameMax} autoComplete="given-name" onChange={(e) => setName(e.target.value)} className={inputClass} aria-invalid={!!errors.name} />
          {errors.name && <p className="m-0 text-sm text-[var(--danger)]">{errors.name}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${ids}-city`} className="font-semibold">{t.city} <span className="font-normal text-[var(--muted)]">{t.optional}</span></label>
          <input id={`${ids}-city`} value={city} maxLength={REVIEW_LIMITS.cityMax} autoComplete="address-level2" onChange={(e) => setCity(e.target.value)} className={inputClass} aria-invalid={!!errors.city} />
          {errors.city && <p className="m-0 text-sm text-[var(--danger)]">{errors.city}</p>}
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${ids}-photos`} className="font-semibold">{t.photos} <span className="font-normal text-[var(--muted)]">{t.photosUpTo(REVIEW_LIMITS.photosMax)}</span></label>
        <input id={`${ids}-photos`} type="file" accept="image/jpeg,image/png" multiple disabled={busy || photos.length >= REVIEW_LIMITS.photosMax}
          onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} className="peer sr-only" />
        {/* The browser's own file button speaks the browser's language; this one speaks the page language. */}
        <label htmlFor={`${ids}-photos`} aria-hidden="true"
          className={`justify-self-start rounded-full border border-[var(--ink)] px-5 py-2.5 font-semibold peer-focus-visible:outline peer-focus-visible:outline-2 ${busy || photos.length >= REVIEW_LIMITS.photosMax ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
          {busy ? t.processing : photos.length ? t.addMore : t.addPhotos}
        </label>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={p.dataUrl.slice(-40) + i} className="relative h-20 w-20 overflow-hidden rounded-xl bg-[var(--surface)]">
                <Image src={p.dataUrl} alt={t.yourPhoto(i + 1)} fill sizes="80px" unoptimized className="object-cover" />
                <button type="button" onClick={() => setPhotos((list) => list.filter((_, n) => n !== i))} aria-label={t.removePhoto(i + 1)}
                  className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--inv-bg)] text-[var(--inv-fg)]">×</button>
              </div>
            ))}
          </div>
        )}
        {errors.photos && <p className="m-0 text-sm text-[var(--danger)]">{errors.photos}</p>}
      </div>

      <button type="submit" disabled={busy} className="justify-self-start rounded-full bg-[var(--buy)] px-6 py-3 font-bold text-[var(--buy-fg)] disabled:opacity-60">
        {busy ? t.wait : t.send}
      </button>
    </form>
  );
}
