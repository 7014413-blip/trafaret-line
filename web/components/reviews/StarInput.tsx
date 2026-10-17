"use client";
// Choice of 1–5 stars: five radio buttons drawn as stars, usable from the keyboard.

import { StarIcon } from "./StarIcon";

export function StarInput({ value, onChange, error, label, words, ratingOf }: {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  label: string;
  /** Words of 1–5 stars. */
  words: readonly string[];
  ratingOf: (n: number, word: string) => string;
}) {
  return (
    <fieldset className="m-0 grid gap-1.5 border-0 p-0" aria-describedby={error ? "rv-rating-error" : undefined}>
      <legend className="mb-1 font-semibold">{label}</legend>
      <div className="flex flex-wrap items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
            <input type="radio" name="rv-rating" value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" aria-label={ratingOf(n, words[n - 1])} />
            <span className={n <= value ? "text-[var(--ink)]" : "text-[var(--muted)]"}><StarIcon fill={n <= value ? 1 : 0} size={30} /></span>
          </label>
        ))}
        {value > 0 && <span className="ml-2 text-[var(--muted)]">{words[value - 1]}</span>}
      </div>
      {error && <p id="rv-rating-error" className="m-0 text-sm text-[var(--danger)]">{error}</p>}
    </fieldset>
  );
}
